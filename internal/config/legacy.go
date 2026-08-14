package config

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"strconv"
)

// legacyConfig mirrors the legacy config JSON shape.
type legacyConfig struct {
	General struct {
		POSID    string `json:"pos_id"`
		MID      string `json:"mid"`
		TrxIDLen string `json:"trx_id_len"`
	} `json:"general"`
	Auth struct {
		APIKey     string `json:"api_key"`
		PrivateKey string `json:"private_key"`
	} `json:"auth"`
	WS struct {
		TLS        string `json:"tls"`
		CACert     string `json:"ca_cert"`
		ClientCert string `json:"client_cert"`
		ClientKey  string `json:"client_key"`
		URL        string `json:"url"`
	} `json:"ws"`
}

// legacyPath replicates legacy config JSON file path.
func legacyPath() string {
	const legacyFile = "pos-simulator-websocket.json"
	var dir string

	switch runtime.GOOS {
	case "windows":
		dir = os.Getenv("APPDATA")
		if dir == "" {
			home, _ := os.UserHomeDir()
			dir = filepath.Join(home, ".pos-simulator")
		}
	default: // posix
		home, _ := os.UserHomeDir()
		dir = filepath.Join(home, ".pos-simulator")
	}

	return filepath.Join(dir, legacyFile)
}

// migrateLegacy loads the old Python config and converts it to Config.
// Returns (Config{}, false, nil) if no legacy file is present.
func migrateLegacy() (Config, bool, error) {
	data, err := os.ReadFile(legacyPath())
	if err != nil {
		if os.IsNotExist(err) {
			return Config{}, false, nil
		}
		return Config{}, false, err
	}

	var lc legacyConfig
	if err := json.Unmarshal(data, &lc); err != nil {
		return Config{}, false, err
	}

	trxId, err := strconv.Atoi(lc.General.TrxIDLen)
	if err != nil {
		return Config{}, false, err
	}

	cfg := Default()
	cfg.General = General{
		POSID:    lc.General.POSID,
		MID:      lc.General.MID,
		TrxIDLen: trxId,
	}
	cfg.Auth = Auth{
		APIKey:     lc.Auth.APIKey,
		PrivateKey: lc.Auth.PrivateKey,
	}
	cfg.TLS = TLS{
		Enabled:          lc.WS.TLS != "" && lc.WS.TLS != "None",
		ClientCertPath:   lc.WS.ClientCert,
		ClientKeyPath:    lc.WS.ClientKey,
		ServerCACertPath: lc.WS.CACert,
		SkipVerify:       true,
	}

	return cfg, true, nil
}
