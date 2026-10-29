package api

import (
	"bytes"
	"log/slog"
	"strings"
	"testing"
)

// Debug logs carried each endpoint's client secret (metrics plugin,
// "Processing endpoint"); a record must log without it, by value or pointer.
func TestCNSIRecordLogsWithoutItsClientSecret(t *testing.T) {
	var buf bytes.Buffer
	log := slog.New(slog.NewTextHandler(&buf, &slog.HandlerOptions{Level: slog.LevelDebug}))
	rec := CNSIRecord{GUID: "g1", ClientId: "stratos_client", ClientSecret: "s3cret-value"}

	log.Debug("by value", "endpoint", rec)
	log.Debug("by pointer", "endpoint", &rec)

	out := buf.String()
	if strings.Contains(out, "s3cret-value") {
		t.Errorf("client secret logged:\n%s", out)
	}
	if strings.Count(out, "stratos_client") != 2 {
		t.Errorf("client ID missing from a line:\n%s", out)
	}
}
