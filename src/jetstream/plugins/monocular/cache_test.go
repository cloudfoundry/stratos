package monocular

import (
	"path"
	"strings"
	"testing"
)

func TestSafeSegmentNeutralisesTraversal(t *testing.T) {
	cases := map[string]string{
		"..":            "_",
		".":             "_",
		"":              "_",
		"../etc":        ".._etc",
		"a/b":           "a_b",
		"a/../../b":     "a_.._.._b",
		"nginx":         "nginx",
		"1.2.3":         "1.2.3",
		"1.0.0+build.5": "1.0.0_build.5",
	}
	for in, want := range cases {
		if got := safeSegment(in); got != want {
			t.Errorf("safeSegment(%q) = %q, want %q", in, got, want)
		}
	}
}

// A sanitised segment must never let a component escape its parent when joined.
func TestSafeSegmentStaysWithinParent(t *testing.T) {
	base := "/cache/endpoint"
	for _, hostile := range []string{"..", "../..", "../../etc", "a/../../b", "/abs"} {
		joined := path.Join(base, safeSegment(hostile))
		if !strings.HasPrefix(joined, base+"/") {
			t.Errorf("%q escaped base: joined = %q", hostile, joined)
		}
	}
}
