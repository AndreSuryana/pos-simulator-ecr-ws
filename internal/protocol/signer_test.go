package protocol

import (
	"crypto/ecdsa"
	"crypto/elliptic"
	"crypto/rand"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"testing"
)

func TestSigner_ValidKeyAndSignature(t *testing.T) {
	// Generate test EC private key
	privateKey, err := ecdsa.GenerateKey(elliptic.P256(), rand.Reader)
	if err != nil {
		t.Fatalf("generate EC key: %v", err)
	}

	derBytes, err := x509.MarshalECPrivateKey(privateKey)
	if err != nil {
		t.Fatalf("marshal EC private key: %v", err)
	}

	pemBlock := pem.EncodeToMemory(&pem.Block{
		Type:  "EC PRIVATE KEY",
		Bytes: derBytes,
	})

	signer, err := NewSigner(string(pemBlock))
	if err != nil {
		t.Fatalf("NewSigner failed: %v", err)
	}

	payload := map[string]string{
		"action": "test_signature",
		"edc_id": "EDC-001",
	}

	sigB64, err := signer.Sign(payload)
	if err != nil {
		t.Fatalf("Sign failed: %v", err)
	}

	sigBytes, err := base64.StdEncoding.DecodeString(sigB64)
	if err != nil {
		t.Fatalf("base64 decode signature: %v", err)
	}

	payloadJSON, _ := json.Marshal(payload)
	hash := sha256.Sum256(payloadJSON)

	if !ecdsa.VerifyASN1(&privateKey.PublicKey, hash[:], sigBytes) {
		t.Errorf("signature verification failed")
	}
}

func TestSigner_InvalidKey(t *testing.T) {
	_, err := NewSigner("not-a-valid-pem")
	if err == nil {
		t.Errorf("expected error with invalid PEM")
	}
}
