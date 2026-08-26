package main

import (
	"io"
	"log/slog"

	log "github.com/sirupsen/logrus"
)

// slogHook forwards logrus output into slog.
//
// This is the reverse of the bridge this file used to hold. Until the
// migration reaches the plugins that still log through logrus, the two
// libraries are both live, and without this their output interleaves on the
// same stream in two different formats with two different level settings.
// slog is the one that stays, so logrus feeds it rather than the other way
// round. Both this hook and its installation go when the last logrus caller
// does.
type slogHook struct{}

func slogLevel(level log.Level) slog.Level {
	switch level {
	case log.PanicLevel, log.FatalLevel, log.ErrorLevel:
		return slog.LevelError
	case log.WarnLevel:
		return slog.LevelWarn
	case log.InfoLevel:
		return slog.LevelInfo
	default:
		return slog.LevelDebug
	}
}

// Levels reports every level: logrus filters before firing hooks, so its own
// level is set to match slog's in installLogrusBridge.
func (slogHook) Levels() []log.Level { return log.AllLevels }

func (slogHook) Fire(entry *log.Entry) error {
	attrs := make([]any, 0, len(entry.Data)*2)
	for k, v := range entry.Data {
		attrs = append(attrs, k, v)
	}
	slog.Log(entry.Context, slogLevel(entry.Level), entry.Message, attrs...)
	return nil
}

// installLogrusBridge points logrus at slog and silences its own writer, so a
// record reaches the output exactly once. Hooks are replaced rather than
// added so calling this twice cannot double-log; nothing else in the tree
// registers a logrus hook.
func installLogrusBridge(level slog.Level) {
	log.SetOutput(io.Discard)
	log.SetLevel(logrusLevel(level))
	hooks := make(log.LevelHooks)
	hooks.Add(slogHook{})
	log.StandardLogger().ReplaceHooks(hooks)
}

// logrusLevel is the inverse of slogLevel, used to keep logrus's own filter in
// step with LOG_LEVEL. slog has no trace level, so debug covers it.
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
