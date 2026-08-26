package main

import (
	"context"
	"log/slog"
	"testing"

	log "github.com/sirupsen/logrus"
	logrustest "github.com/sirupsen/logrus/hooks/test"
)

func TestEchoLoggerWritesThroughLogrus(t *testing.T) {
	hook := logrustest.NewGlobal()
	defer hook.Reset()

	previous := log.GetLevel()
	log.SetLevel(log.DebugLevel)
	defer log.SetLevel(previous)

	newEchoLogger().Error("upgrade failed", "error", "boom", "endpoint", "cf-1")

	if len(hook.Entries) != 1 {
		t.Fatalf("expected 1 logrus entry, got %d", len(hook.Entries))
	}
	entry := hook.LastEntry()
	if entry.Level != log.ErrorLevel {
		t.Errorf("level = %v, want error", entry.Level)
	}
	if entry.Message != "upgrade failed" {
		t.Errorf("message = %q, want %q", entry.Message, "upgrade failed")
	}
	if entry.Data["error"] != "boom" || entry.Data["endpoint"] != "cf-1" {
		t.Errorf("attributes not carried through: %v", entry.Data)
	}
}

func TestEchoLoggerMapsLevels(t *testing.T) {
	hook := logrustest.NewGlobal()
	defer hook.Reset()

	previous := log.GetLevel()
	log.SetLevel(log.DebugLevel)
	defer log.SetLevel(previous)

	logger := newEchoLogger()
	logger.Debug("d")
	logger.Info("i")
	logger.Warn("w")
	logger.Error("e")

	want := []log.Level{log.DebugLevel, log.InfoLevel, log.WarnLevel, log.ErrorLevel}
	if len(hook.Entries) != len(want) {
		t.Fatalf("expected %d entries, got %d", len(want), len(hook.Entries))
	}
	for i, level := range want {
		if hook.Entries[i].Level != level {
			t.Errorf("entry %d level = %v, want %v", i, hook.Entries[i].Level, level)
		}
	}
}

// The whole point of the bridge: LOG_LEVEL must govern Echo's output too.
func TestEchoLoggerRespectsLogLevel(t *testing.T) {
	hook := logrustest.NewGlobal()
	defer hook.Reset()

	previous := log.GetLevel()
	log.SetLevel(log.WarnLevel)
	defer log.SetLevel(previous)

	logger := newEchoLogger()
	logger.Info("should be suppressed")
	if len(hook.Entries) != 0 {
		t.Fatalf("info logged at warn level: %v", hook.Entries)
	}

	logger.Error("should appear")
	if len(hook.Entries) != 1 {
		t.Fatalf("expected the error to be logged, got %d entries", len(hook.Entries))
	}
}

func TestEchoLoggerCarriesWithAttrs(t *testing.T) {
	hook := logrustest.NewGlobal()
	defer hook.Reset()

	slog.New(&echoLogHandler{}).With("component", "echo").Error("boom")

	if entry := hook.LastEntry(); entry == nil || entry.Data["component"] != "echo" {
		t.Errorf("WithAttrs fields not carried: %+v", hook.Entries)
	}
}

// Enabled lets slog skip building a record at all. logrus filters by level on
// its own, so the suppression test above passes even with Enabled stubbed out
// — this exercises the method itself.
func TestEchoLoggerEnabledTracksLogrusLevel(t *testing.T) {
	previous := log.GetLevel()
	log.SetLevel(log.WarnLevel)
	defer log.SetLevel(previous)

	handler := &echoLogHandler{}
	if handler.Enabled(context.Background(), slog.LevelInfo) {
		t.Error("Enabled reported true for info while logrus is at warn")
	}
	if !handler.Enabled(context.Background(), slog.LevelError) {
		t.Error("Enabled reported false for error while logrus is at warn")
	}
}

func TestSlogDefaultWritesThroughLogrus(t *testing.T) {
	hook := logrustest.NewGlobal()
	defer hook.Reset()

	previous := log.GetLevel()
	log.SetLevel(log.DebugLevel)
	defer log.SetLevel(previous)

	// Modules already migrated to slog call the package-level functions.
	slog.Debug("loaded configuration from file", "path", "/etc/stratos.conf")

	entry := hook.LastEntry()
	if entry == nil {
		t.Fatal("slog.Default() did not reach logrus")
	}
	if entry.Level != log.DebugLevel {
		t.Errorf("level = %v, want debug", entry.Level)
	}
	if entry.Data["path"] != "/etc/stratos.conf" {
		t.Errorf("attributes not carried through: %v", entry.Data)
	}
}
