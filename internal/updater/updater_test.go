package updater

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestCompareVersions(t *testing.T) {
	tests := []struct {
		v1       string
		v2       string
		expected int
	}{
		{"2.2.0", "2.3.0", -1},
		{"2.3.0", "2.2.0", 1},
		{"2.2.0", "2.2.0", 0},
		{"v2.2.0", "2.2.0", 0},
		{"2.2", "2.2.0", 0},
		{"2.1.9", "2.2.0", -1},
		{"2.10.0", "2.9.0", 1},
		{"2.2.0-beta", "2.2.0", 0},
		{"2.2.0", "2.2.1", -1},
	}

	for _, tc := range tests {
		got, err := CompareVersions(tc.v1, tc.v2)
		if err != nil {
			t.Fatalf("CompareVersions(%q, %q) returned error: %v", tc.v1, tc.v2, err)
		}
		if got != tc.expected {
			t.Errorf("CompareVersions(%q, %q) = %d, expected %d", tc.v1, tc.v2, got, tc.expected)
		}
	}
}

func TestCheck_Available(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rel := githubRelease{
			TagName:     "v2.3.0",
			Name:        "Release v2.3.0",
			HTMLURL:     "https://github.com/AndreSuryana/pos-simulator-ecr-ws/releases/tag/v2.3.0",
			PublishedAt: "2026-10-14T10:00:00Z",
			Body:        "New features and bug fixes",
			Assets: []githubAsset{
				{
					Name:               "pos-simulator-windows-v2.3.0.zip",
					Size:               1234567,
					Digest:             "sha256:abcdef0123456789",
					BrowserDownloadURL: "https://github.com/AndreSuryana/pos-simulator-ecr-ws/releases/download/v2.3.0/pos-simulator-windows-v2.3.0.zip",
				},
			},
		}
		_ = json.NewEncoder(w).Encode(rel)
	}))
	defer server.Close()

	info, err := Check(context.Background(), server.URL, "2.2.0")
	if err != nil {
		t.Fatalf("Check error: %v", err)
	}

	if !info.Available {
		t.Errorf("expected Available=true, got false")
	}
	if info.LatestVersion != "2.3.0" {
		t.Errorf("expected LatestVersion=2.3.0, got %s", info.LatestVersion)
	}
	if info.SHA256 != "abcdef0123456789" {
		t.Errorf("expected SHA256=abcdef0123456789, got %s", info.SHA256)
	}
	if info.Size != 1234567 {
		t.Errorf("expected Size=1234567, got %d", info.Size)
	}
}

func TestCheck_NotAvailable(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rel := githubRelease{
			TagName: "v2.2.0",
			Assets: []githubAsset{
				{
					Name:               "pos-simulator-windows-v2.2.0.zip",
					Size:               1234567,
					Digest:             "sha256:abc",
					BrowserDownloadURL: "https://github.com/AndreSuryana/pos-simulator-ecr-ws/releases/download/v2.2.0/pos-simulator-windows-v2.2.0.zip",
				},
			},
		}
		_ = json.NewEncoder(w).Encode(rel)
	}))
	defer server.Close()

	info, err := Check(context.Background(), server.URL, "2.2.0")
	if err != nil {
		t.Fatalf("Check error: %v", err)
	}

	if info.Available {
		t.Errorf("expected Available=false, got true")
	}
}

func TestCheck_VariantIsolation(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		rel := githubRelease{
			TagName: "v2.4.0",
			Assets: []githubAsset{
				{
					Name:               "pos-simulator-windows-v2.4.0.zip",
					Size:               1000,
					Digest:             "sha256:stdhash",
					BrowserDownloadURL: "https://example.com/pos-simulator-windows-v2.4.0.zip",
				},
				{
					Name:               "pos-simulator-windows-v2.4.0-bri.zip",
					Size:               2000,
					Digest:             "sha256:brihash",
					BrowserDownloadURL: "https://example.com/pos-simulator-windows-v2.4.0-bri.zip",
				},
			},
		}
		_ = json.NewEncoder(w).Encode(rel)
	}))
	defer server.Close()

	// Check standard client
	stdInfo, err := Check(context.Background(), server.URL, "2.3.0")
	if err != nil {
		t.Fatalf("Standard check failed: %v", err)
	}
	if !stdInfo.Available {
		t.Errorf("Standard expected Available=true")
	}
	if stdInfo.LatestVersion != "2.4.0" {
		t.Errorf("Standard LatestVersion = %s, expected 2.4.0", stdInfo.LatestVersion)
	}
	if stdInfo.DownloadURL != "https://example.com/pos-simulator-windows-v2.4.0.zip" {
		t.Errorf("Standard DownloadURL = %s, expected standard zip", stdInfo.DownloadURL)
	}
	if stdInfo.SHA256 != "stdhash" {
		t.Errorf("Standard SHA256 = %s, expected stdhash", stdInfo.SHA256)
	}

	// Check BRI client
	briInfo, err := Check(context.Background(), server.URL, "2.3.0-bri")
	if err != nil {
		t.Fatalf("BRI check failed: %v", err)
	}
	if !briInfo.Available {
		t.Errorf("BRI expected Available=true")
	}
	if briInfo.LatestVersion != "2.4.0-bri" {
		t.Errorf("BRI LatestVersion = %s, expected 2.4.0-bri", briInfo.LatestVersion)
	}
	if briInfo.DownloadURL != "https://example.com/pos-simulator-windows-v2.4.0-bri.zip" {
		t.Errorf("BRI DownloadURL = %s, expected bri zip", briInfo.DownloadURL)
	}
	if briInfo.SHA256 != "brihash" {
		t.Errorf("BRI SHA256 = %s, expected brihash", briInfo.SHA256)
	}
}
