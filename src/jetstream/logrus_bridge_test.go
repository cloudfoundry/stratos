package main

import (
	"bytes"
	"encoding/json"
	"io"
	"log/slog"
	"testing"

	log "github.com/sirupsen/logrus"
)

// captureSlog installs a JSON handler over a buffer and restores the previous
// default logger, so assertions read what the process would actually write.
func captureSlog(t *testing.T, level slog.Level) *bytes.Buffer {
	t.Helper()

	var buf bytes.Buffer
	previous := slog.Default()
	slog.SetDefault(slog.New(slog.NewJSONHandler(&buf, &slog.HandlerOptions{Level: level})))

	previousLevel := log.GetLevel()
	previousOut := log.StandardLogger().Out
	previousHooks := log.StandardLogger().Hooks
	installLogrusBridge(level)

	t.Cleanup(func() {
		slog.SetDefault(previous)
		log.SetLevel(previousLevel)
		log.SetOutput(previousOut)
		log.StandardLogger().ReplaceHooks(previousHooks)
	})

	return &buf
}

func decodeRecord(t *testing.T, buf *bytes.Buffer) map[string]any {
	t.Helper()

	if buf.Len() == 0 {
		t.Fatal("logrus output did not reach slog")
	}
	var record map[string]any
	if err := json.Unmarshal(buf.Bytes(), &record); err != nil {
		t.Fatalf("could not decode the slog record: %v (%q)", err, buf.String())
	}
	return record
}

func TestLogrusWritesThroughSlog(t *testing.T) {
	buf := captureSlog(t, slog.LevelDebug)

	log.WithFields(log.Fields{"endpoint": "cf-1", "error": "boom"}).Error("upgrade failed")

	record := decodeRecord(t, buf)
	if record["msg"] != "upgrade failed" {
		t.Errorf("msg = %v, want %q", record["msg"], "upgrade failed")
	}
	if record["level"] != "ERROR" {
		t.Errorf("level = %v, want ERROR", record["level"])
	}
	if record["endpoint"] != "cf-1" || record["error"] != "boom" {
		t.Errorf("fields not carried through: %v", record)
	}
}

func TestLogrusBridgeMapsLevels(t *testing.T) {
	for _, tc := range []struct {
		emit func()
		want string
	}{
		{func() { log.Debug("m") }, "DEBUG"},
		{func() { log.Info("m") }, "INFO"},
		{func() { log.Warn("m") }, "WARN"},
		{func() { log.Error("m") }, "ERROR"},
	} {
		// Subtests so each iteration gets its own hook set - captureSlog's
		// cleanup runs when its test ends, not when the loop turns over.
		t.Run(tc.want, func(t *testing.T) {
			buf := captureSlog(t, slog.LevelDebug)
			tc.emit()
			if got := decodeRecord(t, buf)["level"]; got != tc.want {
				t.Errorf("level = %v, want %v", got, tc.want)
			}
		})
	}
}

func TestLogrusBridgeHonoursLogLevel(t *testing.T) {
	buf := captureSlog(t, slog.LevelWarn)

	log.Debug("should be filtered out")
	if buf.Len() != 0 {
		t.Errorf("debug record survived a warn-level logger: %q", buf.String())
	}

	log.Warn("should get through")
	if buf.Len() == 0 {
		t.Error("warn record was filtered out by a warn-level logger")
	}
}

// logrus must not also write to its own stream, or every record appears twice.
func TestLogrusBridgeDoesNotDoubleWrite(t *testing.T) {
	captureSlog(t, slog.LevelDebug)

	if out := log.StandardLogger().Out; out != io.Discard {
		t.Errorf("logrus output = %T, want io.Discard - records would appear twice", out)
	}
}
