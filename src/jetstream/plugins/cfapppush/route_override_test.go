package cfapppush

import (
	"os"
	"path/filepath"
	"testing"

	yaml "gopkg.in/yaml.v2"
)

func TestComposeRoute(t *testing.T) {
	cases := []struct {
		name   string
		host   string
		domain string
		path   string
		want   string
	}{
		{"host and domain", "web", "apps.example.com", "", "web.apps.example.com"},
		{"domain only", "", "apps.example.com", "", "apps.example.com"},
		{"host domain and path", "web", "apps.example.com", "foo", "web.apps.example.com/foo"},
		{"domain and path", "", "apps.example.com", "foo", "apps.example.com/foo"},
		{"path leading slash is normalised", "web", "apps.example.com", "/foo", "web.apps.example.com/foo"},
		{"host only is not a valid route", "web", "", "", ""},
		{"path only is not a valid route", "", "", "foo", ""},
		{"neither", "", "", "", ""},
		{"trims whitespace", " web ", " apps.example.com ", " foo ", "web.apps.example.com/foo"},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			if got := composeRoute(tc.host, tc.domain, tc.path); got != tc.want {
				t.Errorf("composeRoute(%q, %q, %q) = %q, want %q", tc.host, tc.domain, tc.path, got, tc.want)
			}
		})
	}
}

// writeManifest writes a manifest to a temp file and returns its path.
func writeManifest(t *testing.T, body string) string {
	t.Helper()
	dir := t.TempDir()
	path := filepath.Join(dir, "manifest.yml")
	if err := os.WriteFile(path, []byte(body), 0600); err != nil {
		t.Fatalf("failed to write manifest: %v", err)
	}
	return path
}

// firstApp parses a manifest file and returns the first application as a
// generic map, so tests can assert on arbitrary keys.
func firstApp(t *testing.T, path string) map[interface{}]interface{} {
	t.Helper()
	data, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("failed to read manifest: %v", err)
	}
	var doc struct {
		Applications []map[interface{}]interface{} `yaml:"applications"`
	}
	if err := yaml.Unmarshal(data, &doc); err != nil {
		t.Fatalf("failed to parse manifest: %v", err)
	}
	if len(doc.Applications) == 0 {
		t.Fatalf("manifest has no applications")
	}
	return doc.Applications[0]
}

func TestApplyRouteOverride_ConvertsHostDomainToRoutes(t *testing.T) {
	path := writeManifest(t, `applications:
- name: myapp
  memory: 256M
  command: bundle exec rails s
  services:
  - my-db
  host: oldhost
  domain: old.example.com
  routes:
  - route: stale.example.com
`)

	if err := applyRouteOverride(path, CFPushAppOverrides{Host: "web", Domain: "apps.example.com"}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}

	app := firstApp(t, path)

	// override-wins: the route set is replaced with the composed route.
	routes, ok := app["routes"].([]interface{})
	if !ok || len(routes) != 1 {
		t.Fatalf("expected exactly one route, got %#v", app["routes"])
	}
	route := routes[0].(map[interface{}]interface{})
	if route["route"] != "web.apps.example.com" {
		t.Errorf("route = %v, want web.apps.example.com", route["route"])
	}

	// deprecated route keys must be stripped (cf v8 rejects both styles).
	for _, k := range []string{"host", "hosts", "domain", "domains", "no-hostname"} {
		if _, present := app[k]; present {
			t.Errorf("deprecated key %q should have been removed", k)
		}
	}

	// unrelated fields are preserved.
	if app["name"] != "myapp" {
		t.Errorf("name = %v, want myapp", app["name"])
	}
	if app["memory"] != "256M" {
		t.Errorf("memory = %v, want 256M", app["memory"])
	}
	if app["command"] != "bundle exec rails s" {
		t.Errorf("command = %v, want bundle exec rails s", app["command"])
	}
	if _, present := app["services"]; !present {
		t.Errorf("services should have been preserved")
	}
}

func TestApplyRouteOverride_DomainOnly(t *testing.T) {
	path := writeManifest(t, `applications:
- name: myapp
`)
	if err := applyRouteOverride(path, CFPushAppOverrides{Domain: "apps.example.com"}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}
	app := firstApp(t, path)
	routes := app["routes"].([]interface{})
	if len(routes) != 1 || routes[0].(map[interface{}]interface{})["route"] != "apps.example.com" {
		t.Errorf("expected single apex route, got %#v", app["routes"])
	}
}

func TestApplyRouteOverride_FoldsPathIntoRoute(t *testing.T) {
	path := writeManifest(t, `applications:
- name: myapp
`)
	if err := applyRouteOverride(path, CFPushAppOverrides{Host: "web", Domain: "apps.example.com", Path: "/api"}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}
	app := firstApp(t, path)
	routes := app["routes"].([]interface{})
	if len(routes) != 1 || routes[0].(map[interface{}]interface{})["route"] != "web.apps.example.com/api" {
		t.Errorf("expected route with path, got %#v", app["routes"])
	}
}

func TestApplyRouteOverride_NoRouteLeavesFileUntouched(t *testing.T) {
	body := `applications:
- name: myapp
`
	path := writeManifest(t, body)
	before, _ := os.ReadFile(path)

	// host/domain can leak through from disabled fields; no-route must win.
	if err := applyRouteOverride(path, CFPushAppOverrides{Host: "web", Domain: "apps.example.com", NoRoute: true}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}

	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Errorf("no-route override must not inject a route")
	}
}

func TestApplyRouteOverride_RandomRouteLeavesFileUntouched(t *testing.T) {
	body := `applications:
- name: myapp
`
	path := writeManifest(t, body)
	before, _ := os.ReadFile(path)

	if err := applyRouteOverride(path, CFPushAppOverrides{Host: "web", Domain: "apps.example.com", RandomRoute: true}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}

	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Errorf("random-route override must not inject a specific route")
	}
}

func TestApplyRouteOverride_NoOverrideLeavesFileUntouched(t *testing.T) {
	body := `applications:
- name: myapp
  host: oldhost
  domain: old.example.com
`
	path := writeManifest(t, body)
	before, _ := os.ReadFile(path)

	if err := applyRouteOverride(path, CFPushAppOverrides{}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}

	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Errorf("file should be untouched when no host/domain override is supplied\nbefore:\n%s\nafter:\n%s", before, after)
	}
}

func TestApplyRouteOverride_HostOnlyLeavesFileUntouched(t *testing.T) {
	body := `applications:
- name: myapp
`
	path := writeManifest(t, body)
	before, _ := os.ReadFile(path)

	if err := applyRouteOverride(path, CFPushAppOverrides{Host: "web"}); err != nil {
		t.Fatalf("applyRouteOverride returned error: %v", err)
	}

	after, _ := os.ReadFile(path)
	if string(before) != string(after) {
		t.Errorf("host-only override has no domain to attach; file should be untouched")
	}
}
