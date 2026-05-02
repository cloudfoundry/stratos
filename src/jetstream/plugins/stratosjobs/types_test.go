package stratosjobs

import (
	"encoding/json"
	"strings"
	"testing"
	"time"
)

func TestJobStage_JSONRoundTrip(t *testing.T) {
	in := JobStage{
		Code:      "STAGING",
		Label:     "Staging droplet",
		Index:     2,
		Of:        6,
		EnteredAt: time.Date(2026, 5, 2, 12, 30, 0, 0, time.UTC),
	}
	raw, err := json.Marshal(in)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	var out JobStage
	if err := json.Unmarshal(raw, &out); err != nil {
		t.Fatalf("unmarshal: %v", err)
	}
	if out != in {
		t.Errorf("round trip mismatch: got %+v want %+v", out, in)
	}
}

func TestStratosJob_StagesOmitEmpty(t *testing.T) {
	j := StratosJob{
		ID:    "abc",
		Kind:  "test",
		State: JobStateProcessing,
	}
	raw, err := json.Marshal(j)
	if err != nil {
		t.Fatalf("marshal: %v", err)
	}
	if strings.Contains(string(raw), `"stages"`) {
		t.Errorf("stages should be omitempty when nil; body=%s", string(raw))
	}
}
