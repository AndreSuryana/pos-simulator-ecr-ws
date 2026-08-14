package config

// Config represents the application's persistent configuration.
//
// All fields are automatically persisted whenever updated.
type Config struct {
	// General

	POSID    string `json:"posId"`
	MID      string `json:"mid"`
	TrxIDLen int    `json:"trxIdLen"`

	// Connection

	ServerURL string `json:"serverUrl"`

	// Authentication

	APIKey     string `json:"apiKey"`
	PrivateKey string `json:"privateKey"`

	// TLS

	TLSEnabled       bool   `json:"tlsEnabled"`
	ClientCertPath   string `json:"clientCertPath"`
	ClientKeyPath    string `json:"clientKeyPath"`
	ServerCACertPath string `json:"serverCACertPath"`
	SkipTLSVerify    bool   `json:"skipTlsVerify"`

	// ECR

	Mode string `json:"mode"`
}

// Default returns the default application configuration.
func Default() Config {
	return Config{
		POSID:    "POS-SIMULATOR",
		MID:      "MID000000000017",
		TrxIDLen: 14,

		ServerURL: "ws://localhost:3000/",
		Mode:      "",
	}
}
