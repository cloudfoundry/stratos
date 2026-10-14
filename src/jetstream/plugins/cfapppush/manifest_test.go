package cfapppush

import (
	"encoding/json"
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

// fetchManifest rewrites the user's manifest to add the STRATOS_PROJECT env
// var. The rewrite must keep every field it does not model, or cf push never
// sees them.
func TestFetchManifest_KeepsFieldsItDoesNotModel(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "manifest.yml")
	src := `version: 1
applications:
- name: my-app
  memory: 256M
  log-rate-limit-per-second: 16K
  readiness-health-check-type: http
  metadata:
    labels:
      env: prod
    annotations:
      contact: team@example.com
  processes:
  - type: worker
    instances: 2
  sidecars:
  - name: agent
    process_types: [web]
    command: ./agent
`
	if err := os.WriteFile(path, []byte(src), 0600); err != nil {
		t.Fatal(err)
	}

	if _, _, err := fetchManifest(dir, "", StratosProject{DeploySource: "git"}, nil); err != nil {
		t.Fatalf("fetchManifest: %v", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var got struct {
		Version      any              `yaml:"version"`
		Applications []map[string]any `yaml:"applications"`
	}
	if err := yaml.Load(data, &got); err != nil {
		t.Fatalf("rewritten manifest does not parse: %v", err)
	}
	if got.Version == nil {
		t.Error("top-level version was dropped")
	}
	if len(got.Applications) != 1 {
		t.Fatalf("got %d applications, want 1", len(got.Applications))
	}
	app := got.Applications[0]
	for _, key := range []string{"log-rate-limit-per-second", "readiness-health-check-type", "metadata", "processes", "sidecars"} {
		if _, ok := app[key]; !ok {
			t.Errorf("application field %q was dropped", key)
		}
	}
	if env, _ := app["env"].(map[string]any); env[stratosProjectKey] == nil {
		t.Errorf("env %s was not added", stratosProjectKey)
	}
}

// The env var goes into an existing env block without disturbing it, and an
// application that inherits env through a merge key keeps what it inherited.
func TestFetchManifest_AddsEnvVarAlongsideExistingEnv(t *testing.T) {
	dir := t.TempDir()
	path := filepath.Join(dir, "manifest.yml")
	src := `defaults: &defaults
  env:
    INHERITED: from-anchor
applications:
- name: own-env
  env:
    PORT: 8080
    STRATOS_PROJECT: stale
- name: merged-env
  <<: *defaults
`
	if err := os.WriteFile(path, []byte(src), 0600); err != nil {
		t.Fatal(err)
	}

	project := StratosProject{DeploySource: "git"}
	if _, _, err := fetchManifest(dir, "", project, nil); err != nil {
		t.Fatalf("fetchManifest: %v", err)
	}

	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatal(err)
	}
	var got Applications
	if err := yaml.Load(data, &got); err != nil {
		t.Fatalf("rewritten manifest does not parse: %v", err)
	}
	want, _ := json.Marshal(project)
	if len(got.Applications) != 2 {
		t.Fatalf("got %d applications, want 2", len(got.Applications))
	}
	own, merged := got.Applications[0].EnvironmentVariables, got.Applications[1].EnvironmentVariables
	if own["PORT"] != "8080" || own[stratosProjectKey] != string(want) {
		t.Errorf("own-env: got %v", own)
	}
	if merged["INHERITED"] != "from-anchor" || merged[stratosProjectKey] != string(want) {
		t.Errorf("merged-env: got %v", merged)
	}
}
