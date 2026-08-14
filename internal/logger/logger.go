package logger

import (
	"context"
	"fmt"
	"log/slog"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const EventName = "log"

// Logger provides structured logging and emits log events to the Wails frontend.
//
// Logger is safe for concurrent use.
type Logger struct {
	ctx context.Context

	logger *slog.Logger

	mu sync.RWMutex
}

// Entry represents a log entry emitted to the frontend.
type Entry struct {
	Level   string `json:"level"`
	Message string `json:"message"`
}

// New creates a new Logger.
func New() *Logger {
	return &Logger{
		logger: slog.Default(),
	}
}

// SetContext sets the Wails application context.
//
// This should be called once from App.startup().
func (l *Logger) SetContext(ctx context.Context) {
	l.mu.Lock()
	defer l.mu.Unlock()

	l.ctx = ctx
}

// Debug logs a debug message.
func (l *Logger) Debug(message string, args ...any) {
	l.log(slog.LevelDebug, message, args...)
}

// Info logs an informational message.
func (l *Logger) Info(message string, args ...any) {
	l.log(slog.LevelInfo, message, args...)
}

// Warn logs a warning message.
func (l *Logger) Warn(message string, args ...any) {
	l.log(slog.LevelWarn, message, args...)
}

// Error logs an error message.
func (l *Logger) Error(message string, err error, args ...any) {
	if err != nil {
		args = append(args, "error", err)
		message = fmt.Sprintf("%s: %v", message, err)
	}

	l.log(slog.LevelError, message, args...)
}

func (l *Logger) log(level slog.Level, message string, args ...any) {
	l.logger.Log(context.Background(), level, message, args...)

	l.mu.RLock()
	ctx := l.ctx
	l.mu.RUnlock()

	if ctx == nil {
		return
	}

	runtime.EventsEmit(ctx, EventName, Entry{
		Level:   level.String(),
		Message: message,
	})
}
