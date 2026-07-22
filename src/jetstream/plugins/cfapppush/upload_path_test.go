package cfapppush

import (
	"path/filepath"
	"testing"
)

func TestSafeUploadJoinRejectsTraversal(t *testing.T) {
	base := "/tmp/upload"
	cases := []struct {
		name    string
		blocked bool
	}{
		// Escaping names must be rejected.
		{"../evil", true},
		{"../../etc/passwd", true},
		{"a/../../b", true},
		{"/etc/passwd", true},
		{"", true},
		// Legitimate local names (including nested) must pass.
		{"app.js", false},
		{"src/main.go", false},
		{"a/b/c.txt", false},
	}

	for _, tc := range cases {
		got, err := safeUploadJoin(base, tc.name)
		if tc.blocked {
			if err == nil {
				t.Errorf("expected %q to be rejected, got path %q", tc.name, got)
			}
			continue
		}
		if err != nil {
			t.Errorf("expected %q to be allowed, got error: %v", tc.name, err)
			continue
		}
		// Allowed results must stay within base.
		rel, relErr := filepath.Rel(base, got)
		if relErr != nil || !filepath.IsLocal(rel) {
			t.Errorf("%q resolved outside base: %q", tc.name, got)
		}
	}
}
