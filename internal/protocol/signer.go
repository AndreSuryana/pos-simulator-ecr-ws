package protocol

import (
	"crypto/ecdsa"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"fmt"
	"strings"
)

// Signer signs ECR protocol payloads using an ECDSA private key.
type Signer struct {
	privateKey *ecdsa.PrivateKey
}

// NewSigner creates a new Signer from a PEM-encoded EC private key.
//
// Both SEC1 ("BEGIN EC PRIVATE KEY") and PKCS#8 ("BEGIN PRIVATE KEY")
// formats are supported.
func NewSigner(privateKeyPEM string) (*Signer, error) {
	block, _ := pem.Decode([]byte(strings.TrimSpace(privateKeyPEM)))
	if block == nil {
		return nil, fmt.Errorf("failed to decode PEM private key")
	}

	// SEC1
	if key, err := x509.ParseECPrivateKey(block.Bytes); err == nil {
		return &Signer{privateKey: key}, nil
	}

	// PKCS#8
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, fmt.Errorf("failed to parse EC private key: %w", err)
	}

	privateKey, ok := key.(*ecdsa.PrivateKey)
	if !ok {
		return nil, fmt.Errorf("private key is not an ECDSA key")
	}

	return &Signer{privateKey: privateKey}, nil
}

// Sign signs the given payload using ECDSA with SHA-256.
//
// The payload is first serialized into compact JSON, then signed.
// The returned signature is Base64-encoded ASN.1 DER.
func (s *Signer) Sign(payload any) (string, error) {
	message, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("marshal payload: %w", err)
	}

	hash := sha256.Sum256(message)

	signature, err := ecdsa.SignASN1(rand.Reader, s.privateKey, hash[:])
	if err != nil {
		return "", fmt.Errorf("sign payload: %w", err)
	}

	return base64.StdEncoding.EncodeToString(signature), nil
}
