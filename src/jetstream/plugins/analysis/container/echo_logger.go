package main

import (
	"context"
	"log/slog"

	log "github.com/sirupsen/logrus"
)

// echoLogHandler forwards Echo's slog output into logrus.
//
// Echo v5 logs through *slog.Logger and defaults to a JSON handler writing to
// stdout at a fixed level. Jetstream logs everything else through logrus, so
// without this the two interleave on the same stream in different formats and
// Echo's half ignores LOG_LEVEL entirely.
type echoLogHandler struct {
	fields log.Fields
}

func logrusLevel(level slog.Level) log.Level {
	switch {
	case level >= slog.LevelError:
		return log.ErrorLevel
	case level >= slog.LevelWarn:
		return log.WarnLevel
	case level >= slog.LevelInfo:
		return log.InfoLevel
	default:
		return log.DebugLevel
	}
}

func (h *echoLogHandler) Enabled(_ context.Context, level slog.Level) bool {
	return log.IsLevelEnabled(logrusLevel(level))
}

func (h *echoLogHandler) Handle(_ context.Context, record slog.Record) error {
	fields := make(log.Fields, len(h.fields)+record.NumAttrs())
	for k, v := range h.fields {
		fields[k] = v
	}
	record.Attrs(func(attr slog.Attr) bool {
		fields[attr.Key] = attr.Value.Any()
		return true
	})
	log.WithFields(fields).Log(logrusLevel(record.Level), record.Message)
	return nil
}

func (h *echoLogHandler) WithAttrs(attrs []slog.Attr) slog.Handler {
	fields := make(log.Fields, len(h.fields)+len(attrs))
	for k, v := range h.fields {
		fields[k] = v
	}
	for _, attr := range attrs {
		fields[attr.Key] = attr.Value.Any()
	}
	return &echoLogHandler{fields: fields}
}

// WithGroup prefixes nothing: logrus fields are flat, and Echo does not group.
func (h *echoLogHandler) WithGroup(string) slog.Handler { return h }

// newEchoLogger builds the logger handed to echo.Echo.Logger.
func newEchoLogger() *slog.Logger {
	return slog.New(&echoLogHandler{})
}
