package cfapppush

import (
	"errors"
	"os"
	"path/filepath"
	"testing"

	yaml "go.yaml.in/yaml/v4"
)

func TestLocateManifest_PrefersExistingYml(t *testing.T) {
	dir := t.TempDir()
	want := filepath.Join(dir, "manifest.yml")
	if err := os.WriteFile(want, []byte("applications:\n- name: from-repo\n"), 0600); err != nil {
		t.Fatal(err)
	}

	got, generated, err := locateManifest(dir, "override")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != want || generated {
		t.Errorf("got (%q, generated=%v), want (%q, generated=false)", got, generated, want)
	}
}

func TestLocateManifest_FindsYaml(t *testing.T) {
	dir := t.TempDir()
	want := filepath.Join(dir, "manifest.yaml")
	if err := os.WriteFile(want, []byte("applications:\n- name: from-repo\n"), 0600); err != nil {
		t.Fatal(err)
	}

	got, generated, err := locateManifest(dir, "")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if got != want || generated {
		t.Errorf("got (%q, generated=%v), want (%q, generated=false)", got, generated, want)
	}
}

func TestLocateManifest_GeneratesFromAppNameWhenMissing(t *testing.T) {
	dir := t.TempDir()

	got, generated, err := locateManifest(dir, "my-app")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !generated {
		t.Error("expected the manifest to be reported as generated")
	}
	if got != filepath.Join(dir, "manifest.yml") {
		t.Errorf("generated manifest at %q, want it in the app dir", got)
	}

	data, err := os.ReadFile(got)
	if err != nil {
		t.Fatalf("generated manifest not readable: %v", err)
	}
	var manifest Applications
	if err := yaml.Load(data, &manifest); err != nil {
		t.Fatalf("generated manifest does not parse: %v", err)
	}
	if len(manifest.Applications) != 1 || manifest.Applications[0].Name != "my-app" {
		t.Errorf("generated manifest = %+v, want one application named my-app", manifest.Applications)
	}
}

func TestLocateManifest_NoManifestAndNoNameFails(t *testing.T) {
	dir := t.TempDir()

	_, _, err := locateManifest(dir, "  ")
	if !errors.Is(err, errNoManifest) {
		t.Fatalf("got error %v, want errNoManifest", err)
	}
	if entries, _ := os.ReadDir(dir); len(entries) != 0 {
		t.Errorf("nothing should be written without a name, found %d entries", len(entries))
	}
}
