package updater

import (
	"context"
	"fmt"
	"io"
	"net/http"
	"os"
	"strings"
	"time"
)

// Download streams an update asset to destinationPath with progress reporting.
func Download(ctx context.Context, downloadURL string, destinationPath string, onProgress func(done, total int64)) error {
	if !strings.HasPrefix(downloadURL, AllowedDownloadURLPrefix) {
		return fmt.Errorf("untrusted download url: %s", downloadURL)
	}

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, downloadURL, nil)
	if err != nil {
		return fmt.Errorf("create download request: %w", err)
	}

	req.Header.Set("User-Agent", "pos-simulator-ecr-ws-updater")

	client := &http.Client{
		Transport: http.DefaultTransport,
	}

	resp, err := client.Do(req)
	if err != nil {
		return fmt.Errorf("download request failed: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("download returned http status %d", resp.StatusCode)
	}

	out, err := os.Create(destinationPath)
	if err != nil {
		return fmt.Errorf("create destination file: %w", err)
	}
	defer out.Close()

	totalBytes := resp.ContentLength
	writer := &progressWriter{
		writer:     out,
		total:      totalBytes,
		onProgress: onProgress,
	}

	if _, err := io.Copy(writer, resp.Body); err != nil {
		return fmt.Errorf("write download content: %w", err)
	}

	// Final 100% callback
	if onProgress != nil {
		onProgress(writer.done, totalBytes)
	}

	return nil
}

type progressWriter struct {
	writer     io.Writer
	done       int64
	total      int64
	lastNotify time.Time
	onProgress func(done, total int64)
}

func (pw *progressWriter) Write(p []byte) (int, error) {
	n, err := pw.writer.Write(p)
	pw.done += int64(n)

	now := time.Now()
	if pw.onProgress != nil && now.Sub(pw.lastNotify) > 100*time.Millisecond {
		pw.lastNotify = now
		pw.onProgress(pw.done, pw.total)
	}

	return n, err
}
