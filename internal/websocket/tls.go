package websocket

import (
	"crypto/tls"
	"crypto/x509"
	"fmt"
	"os"
)

// LoadTLSConfig creates a TLS configuration for the WebSocket client.
//
// If clientCertPath or clientKeyPath is empty, client authentication is
// disabled.
//
// If serverCACertPath is empty, the system certificate pool is used.
func LoadTLSConfig(
	clientCertPath string,
	clientKeyPath string,
	serverCACertPath string,
	skipVerify bool,
) (*tls.Config, error) {
	config := &tls.Config{
		InsecureSkipVerify: skipVerify,
	}

	if clientCertPath != "" || clientKeyPath != "" {
		certificate, err := tls.LoadX509KeyPair(clientCertPath, clientKeyPath)
		if err != nil {
			return nil, fmt.Errorf("load client certificate: %w", err)
		}

		config.Certificates = []tls.Certificate{certificate}
	}

	if serverCACertPath != "" {
		caCertificate, err := os.ReadFile(serverCACertPath)
		if err != nil {
			return nil, fmt.Errorf("read CA certificate: %w", err)
		}

		pool := x509.NewCertPool()

		if !pool.AppendCertsFromPEM(caCertificate) {
			return nil, fmt.Errorf("parse CA certificate")
		}

		config.RootCAs = pool
	}

	return config, nil
}
