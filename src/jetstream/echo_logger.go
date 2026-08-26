package main

import (
	"context"
	"log/slog"

	log "github.com/sirupsen/logrus"
)

// echoLogHandler forwards slog output into logrus.
//
// Echo v5 logs through *slog.Logger and defaults to a JSON handler writing to
// stdout at a fixed level. Jetstream logs everything else through logrus, so
// without this the two interleave on the same stream in different formats and
// Echo's half ignores LOG_LEVEL entirely.
//
// The same handler backs slog.Default() while the logrus -> slog migration is
// in progress, so modules already converted to slog keep honouring LOG_LEVEL
// and LOG_TO_JSON. Both this handler and the init below go away once the root
// module is native slog and logrus is gone.
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

func init() {
	slog.SetDefault(newEchoLogger())
}
