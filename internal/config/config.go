package config

import (
	"errors"
	"fmt"
)

// Environment defines a target connection environment: a name and URL the
// user can select in Settings.
type Environment struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	URL  string `json:"url"`
}

// General holds simulator identity fields: sent on registration
// (REGISTER_POS) and used when generating transaction IDs.
type General struct {
	POSID    string `json:"posId"`
	MID      string `json:"mid"`
	TrxIDLen int    `json:"trxIdLen"`
}

// Auth holds signing credentials used to build every outbound message
// (see protocol.Client).
type Auth struct {
	APIKey     string `json:"apiKey"`
	PrivateKey string `json:"privateKey"`
}

// TLS holds connection security settings for the WebSocket client.
type TLS struct {
	Enabled          bool   `json:"enabled"`
	ClientCertPath   string `json:"clientCertPath"`
	ClientKeyPath    string `json:"clientKeyPath"`
	ServerCACertPath string `json:"serverCACertPath"`
	SkipVerify       bool   `json:"skipVerify"`
}

// Config represents the application's persistent configuration.
//
// All fields are automatically persisted whenever updated.
//
// Note: preset environments (DefaultEnvironments) are intentionally NOT
// part of this struct — they're defined in code and resolved at runtime
// via AllEnvironments/ActiveEnvironment. Only user-added custom
// environments and the active selection are persisted, so a future update
// to a preset's URL always reaches existing users instead of being frozen
// into their config file from first run.
type Config struct {
	General General `json:"general"`

	CustomEnvironments  []Environment `json:"customEnvironments"`
	ActiveEnvironmentID string        `json:"activeEnvironmentId"`

	Auth Auth `json:"auth"`
	TLS  TLS  `json:"tls"`
}

// DefaultEnvironments returns the built-in preset environments. These are
// code-defined and never persisted to disk.
func DefaultEnvironments() []Environment {
	return []Environment{
		{
			ID:   "local",
			Name: "Local Development",
			URL:  "wss://192.168.202.110:55567/ws_api_pos/v1/api/",
		},
		{
			ID:   "public-dev",
			Name: "Public Development",
			URL:  "wss://182.253.33.106:55571/ws_api_pos/v1/api/",
		},
	}
}

// IsPresetEnvironment reports whether id belongs to DefaultEnvironments.
// Exported so the UI layer can disable "remove" for preset entries.
func IsPresetEnvironment(id string) bool {
	for _, e := range DefaultEnvironments() {
		if e.ID == id {
			return true
		}
	}
	return false
}

// AllEnvironments returns the full selectable environment list: presets
// followed by the user's custom environments.
func (c *Config) AllEnvironments() []Environment {
	all := make([]Environment, 0, len(DefaultEnvironments())+len(c.CustomEnvironments))
	all = append(all, DefaultEnvironments()...)
	all = append(all, c.CustomEnvironments...)
	return all
}

// ActiveEnvironment resolves the currently active Environment by
// ActiveEnvironmentID, searching presets and custom environments. Falls
// back to the first preset if the ID is empty or no longer exists (e.g. a
// custom environment that was later removed).
func (c *Config) ActiveEnvironment() Environment {
	for _, e := range c.AllEnvironments() {
		if e.ID == c.ActiveEnvironmentID {
			return e
		}
	}
	if presets := DefaultEnvironments(); len(presets) > 0 {
		return presets[0]
	}
	return Environment{}
}

// SetActiveEnvironment sets ActiveEnvironmentID to id, provided id exists
// among presets or custom environments. This is how "last selected
// environment" gets recorded — callers should invoke this on every user
// environment switch, then let Manager.Update persist it.
func (c *Config) SetActiveEnvironment(id string) error {
	for _, e := range c.AllEnvironments() {
		if e.ID == id {
			c.ActiveEnvironmentID = id
			return nil
		}
	}
	return fmt.Errorf("unknown environment %q", id)
}

// AddEnvironment appends a custom, user-defined environment. Returns an
// error if the ID is empty or already in use by a preset or another
// custom environment.
func (c *Config) AddEnvironment(env Environment) error {
	if env.ID == "" {
		return errors.New("environment id is required")
	}
	for _, e := range c.AllEnvironments() {
		if e.ID == env.ID {
			return fmt.Errorf("environment %q already exists", env.ID)
		}
	}
	c.CustomEnvironments = append(c.CustomEnvironments, env)
	return nil
}

// RemoveEnvironment deletes a custom environment by ID. Preset
// environments cannot be removed. If the removed environment was active,
// ActiveEnvironmentID falls back to the first preset.
func (c *Config) RemoveEnvironment(id string) error {
	if IsPresetEnvironment(id) {
		return fmt.Errorf("cannot remove preset environment %q", id)
	}

	idx := -1
	for i, e := range c.CustomEnvironments {
		if e.ID == id {
			idx = i
			break
		}
	}
	if idx == -1 {
		return fmt.Errorf("unknown environment %q", id)
	}

	c.CustomEnvironments = append(c.CustomEnvironments[:idx], c.CustomEnvironments[idx+1:]...)

	if c.ActiveEnvironmentID == id {
		if presets := DefaultEnvironments(); len(presets) > 0 {
			c.ActiveEnvironmentID = presets[0].ID
		}
	}
	return nil
}

// Default returns the default application configuration.
func Default() Config {
	presets := DefaultEnvironments()

	return Config{
		General: General{
			POSID:    "POS-SIMULATOR",
			MID:      "MID000000000017",
			TrxIDLen: 14,
		},
		ActiveEnvironmentID: presets[0].ID,
	}
}
