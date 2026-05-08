package cloudfoundry

import (
	"net/http/httptest"
	"testing"

	"github.com/labstack/echo/v4"
)

func TestParseReturnMode(t *testing.T) {
	cases := []struct {
		query string
		want  ReturnMode
	}{
		{"", ReturnBase},
		{"return=", ReturnBase},
		{"return=counts", ReturnCounts},
		{"return=summary", ReturnSummary},
		{"return=details", ReturnDetails},
		{"return=COUNTS", ReturnCounts},
		{"return=Summary", ReturnSummary},
		{"return=unknown", ReturnBase},
		{"per_page=10", ReturnBase},
		{"return=details&per_page=10", ReturnDetails},
	}
	for _, tc := range cases {
		t.Run(tc.query, func(t *testing.T) {
			req := httptest.NewRequest("GET", "/?"+tc.query, nil)
			rec := httptest.NewRecorder()
			ctx := echo.New().NewContext(req, rec)
			got := parseReturnMode(ctx)
			if got != tc.want {
				t.Errorf("parseReturnMode(%q) = %q, want %q", tc.query, got, tc.want)
			}
		})
	}
}
