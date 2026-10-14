package updater

import (
	"context"
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"
)

const (
	DefaultLatestReleaseURL = "https://api.github.com/repos/AndreSuryana/pos-simulator-ecr-ws/releases/latest"
	AllowedDownloadURLPrefix = "https://github.com/AndreSuryana/pos-simulator-ecr-ws/"
)

// Info holds update availability and metadata.
type Info struct {
	Available      bool   `json:"available"`
	CurrentVersion string `json:"currentVersion"`
	LatestVersion  string `json:"latestVersion"`
	Name           string `json:"name"`
	Changelog      string `json:"changelog"`
	ReleaseURL     string `json:"releaseUrl"`
	DownloadURL    string `json:"downloadUrl"`
	PublishedAt    string `json:"publishedAt"`
	Size           int64  `json:"size"`
	SHA256         string `json:"sha256"`
}

// Progress reports download and installation stages to the UI.
type Progress struct {
	Stage      string  `json:"stage"` // "downloading", "verifying", "extracting", "restarting"
	BytesDone  int64   `json:"bytesDone"`
	TotalBytes int64   `json:"totalBytes"`
	Percent    float64 `json:"percent"`
}

type githubRelease struct {
	TagName     string        `json:"tag_name"`
	Name        string        `json:"name"`
	HTMLURL     string        `json:"html_url"`
	PublishedAt string        `json:"published_at"`
	Body        string        `json:"body"`
	Assets      []githubAsset `json:"assets"`
}

type githubAsset struct {
	Name               string `json:"name"`
	Size               int64  `json:"size"`
	Digest             string `json:"digest"`
	BrowserDownloadURL string `json:"browser_download_url"`
}

// Check checks for the latest release and returns update info.
func Check(ctx context.Context, apiURL string, currentVersion string) (*Info, error) {
	if apiURL == "" {
		apiURL = DefaultLatestReleaseURL
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, apiURL, nil)
	if err != nil {
		return nil, fmt.Errorf("create update check request: %w", err)
	}

	req.Header.Set("Accept", "application/vnd.github+json")
	req.Header.Set("User-Agent", "pos-simulator-ecr-ws-updater")

	client := &http.Client{
		Timeout: 7 * time.Second,
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, fmt.Errorf("fetch latest release: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("github api returned status %d", resp.StatusCode)
	}

	var release githubRelease
	if err := json.NewDecoder(resp.Body).Decode(&release); err != nil {
		return nil, fmt.Errorf("decode release json: %w", err)
	}

	asset := findWindowsZipAsset(release.Assets)
	if asset == nil {
		return nil, fmt.Errorf("no windows zip asset found in release %s", release.TagName)
	}

	cleanLatest := strings.TrimPrefix(strings.TrimSpace(release.TagName), "v")
	cleanCurrent := strings.TrimPrefix(strings.TrimSpace(currentVersion), "v")

	comp, err := CompareVersions(cleanCurrent, cleanLatest)
	if err != nil {
		return nil, fmt.Errorf("compare versions: %w", err)
	}

	isAvailable := comp < 0

	sha256Hash := strings.TrimPrefix(asset.Digest, "sha256:")

	return &Info{
		Available:      isAvailable,
		CurrentVersion: cleanCurrent,
		LatestVersion:  cleanLatest,
		Name:           release.Name,
		Changelog:      release.Body,
		ReleaseURL:     release.HTMLURL,
		DownloadURL:    asset.BrowserDownloadURL,
		PublishedAt:    release.PublishedAt,
		Size:           asset.Size,
		SHA256:         sha256Hash,
	}, nil
}

func findWindowsZipAsset(assets []githubAsset) *githubAsset {
	for _, a := range assets {
		lower := strings.ToLower(a.Name)
		if strings.HasSuffix(lower, ".zip") && strings.Contains(lower, "windows") {
			return &a
		}
	}
	return nil
}

// CompareVersions compares two semver strings (e.g. "2.2.0" and "2.3.0").
// Returns -1 if v1 < v2, 0 if v1 == v2, 1 if v1 > v2.
func CompareVersions(v1, v2 string) (int, error) {
	parts1 := parseVersionParts(v1)
	parts2 := parseVersionParts(v2)

	maxLen := len(parts1)
	if len(parts2) > maxLen {
		maxLen = len(parts2)
	}

	for i := 0; i < maxLen; i++ {
		p1 := 0
		if i < len(parts1) {
			p1 = parts1[i]
		}
		p2 := 0
		if i < len(parts2) {
			p2 = parts2[i]
		}

		if p1 < p2 {
			return -1, nil
		}
		if p1 > p2 {
			return 1, nil
		}
	}

	return 0, nil
}

func parseVersionParts(v string) []int {
	v = strings.TrimPrefix(strings.TrimSpace(v), "v")
	// Strip anything after '-' or '+' (e.g., 2.3.0-dev -> 2.3.0)
	if idx := strings.IndexAny(v, "-+"); idx != -1 {
		v = v[:idx]
	}

	segments := strings.Split(v, ".")
	parts := make([]int, 0, len(segments))
	for _, seg := range segments {
		num, err := strconv.Atoi(seg)
		if err != nil {
			num = 0
		}
		parts = append(parts, num)
	}
	return parts
}
