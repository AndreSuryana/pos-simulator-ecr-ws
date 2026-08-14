package config

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const (
	parentDir  = "pos-simulator-ecr-ws"
	configFile = "config.json"

	saveDelay = 500 * time.Millisecond
)

// Manager manages the application's persistent configuration.
//
// Configuration changes are automatically persisted using a debounced save.
type Manager struct {
	path   string
	config Config

	mu sync.RWMutex

	saveTimer *time.Timer
}

// New creates a configuration manager.
//
// The configuration file is stored in the user's operating system
// configuration directory.
func New() (*Manager, error) {
	path, err := defaultPath()
	if err != nil {
		return nil, err
	}

	manager := &Manager{
		path:   path,
		config: Default(),
	}

	if err := manager.load(); err != nil {
		return nil, err
	}

	return manager, nil
}

// Config returns a snapshot of the current configuration.
func (m *Manager) Config() Config {
	m.mu.RLock()
	defer m.mu.RUnlock()

	return m.config
}

// Update updates the configuration and schedules it to be persisted.
//
// Changes are automatically saved after a short debounce period to avoid
// excessive disk writes while users are typing.
func (m *Manager) Update(update func(*Config)) {
	m.mu.Lock()
	defer m.mu.Unlock()

	update(&m.config)

	if m.saveTimer != nil {
		m.saveTimer.Stop()
	}

	m.saveTimer = time.AfterFunc(saveDelay, func() {
		_ = m.save()
	})
}

func defaultPath() (string, error) {
	dir, err := os.UserConfigDir()
	if err != nil {
		return "", fmt.Errorf("get user config directory: %w", err)
	}

	return filepath.Join(dir, parentDir, configFile), nil
}

func (m *Manager) load() error {
	data, err := os.ReadFile(m.path)
	if err != nil {
		if os.IsNotExist(err) {
			if err := os.MkdirAll(filepath.Dir(m.path), 0o755); err != nil {
				return fmt.Errorf("create config directory: %w", err)
			}

			return m.save()
		}

		return fmt.Errorf("read config: %w", err)
	}

	if err := json.Unmarshal(data, &m.config); err != nil {
		return fmt.Errorf("parse config: %w", err)
	}

	return nil
}

func (m *Manager) save() error {
	m.mu.RLock()
	config := m.config
	m.mu.RUnlock()

	data, err := json.MarshalIndent(config, "", "  ")
	if err != nil {
		return fmt.Errorf("marshal config: %w", err)
	}

	if err := os.WriteFile(m.path, data, 0o644); err != nil {
		return fmt.Errorf("write config: %w", err)
	}

	return nil
}
