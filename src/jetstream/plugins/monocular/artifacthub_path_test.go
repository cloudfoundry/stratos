package monocular

import (
	"path"
	"strings"
	"testing"
)

// The ArtifactHub cache paths are built from route parameters. A hostile
// repo, chart name or version must not be able to walk out of the cache
// directory: path.Join resolves a ".." component rather than rejecting it,
// so confinement has to happen before the join.
func TestArtifactHubCachePathsStayWithinCacheFolder(t *testing.T) {
	m := &Monocular{CacheFolder: "/var/cache/stratos"}
	prefix := m.CacheFolder + "/"

	hostile := []string{"..", "../..", "../../etc", "a/../../b", "/abs", "."}

	for _, h := range hostile {
		if got := m.ahCacheFolder(h); !strings.HasPrefix(got, prefix) {
			t.Errorf("ahCacheFolder(%q) escaped: %q", h, got)
		}
		// each chart-folder component in turn, the others left benign
		for i, args := range [][4]string{
			{h, "repo", "chart", "1.0.0"},
			{"endpoint", h, "chart", "1.0.0"},
			{"endpoint", "repo", h, "1.0.0"},
			{"endpoint", "repo", "chart", h},
		} {
			got := m.ahChartCacheFolder(args[0], args[1], args[2], args[3])
			if !strings.HasPrefix(got, prefix) {
				t.Errorf("ahChartCacheFolder component %d = %q escaped: %q", i, h, got)
			}
			if got != path.Clean(got) {
				t.Errorf("ahChartCacheFolder component %d = %q not clean: %q", i, h, got)
			}
		}
	}
}

// Legitimate values must be unchanged, or every existing cache entry is orphaned.
func TestArtifactHubCachePathsPreserveLegitimateValues(t *testing.T) {
	m := &Monocular{CacheFolder: "/var/cache/stratos"}
	got := m.ahChartCacheFolder("aabbccdd-1122-3344-5566-778899aabbcc", "bitnami", "nginx", "1.2.3")
	want := "/var/cache/stratos/aabbccdd-1122-3344-5566-778899aabbcc/bitnami_nginx_1.2.3"
	if got != want {
		t.Errorf("got %q, want %q", got, want)
	}
}
