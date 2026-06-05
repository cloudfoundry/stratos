package cfapppush

import (
	"os"
	"strings"

	"code.cloudfoundry.org/cli/v8/util/manifestparser"
)

// deprecatedRouteKeys are the manifest route attributes that cf CLI v8 no
// longer supports. They are superseded by `routes:` and cannot coexist with
// it, so they are stripped whenever a route override is applied.
var deprecatedRouteKeys = []string{"host", "hosts", "domain", "domains", "no-hostname"}

// composeRoute builds a route string from the wizard's host/domain/path
// override. cf CLI v8 dropped the `host`/`domain` manifest attributes in
// favour of a `routes:` list whose entries are `host.domain/path` strings, so
// the override has to be expressed as a route. A domain is mandatory: a host
// or path on its own has nothing to attach to, so it yields no route.
func composeRoute(host, domain, path string) string {
	host = strings.TrimSpace(host)
	domain = strings.TrimSpace(domain)
	path = strings.Trim(strings.TrimSpace(path), "/")
	if domain == "" {
		return ""
	}
	route := domain
	if host != "" {
		route = host + "." + domain
	}
	if path != "" {
		route = route + "/" + path
	}
	return route
}

// applyRouteOverride rewrites the manifest file in place so a host/domain
// deploy override takes effect as a v8-style `routes:` entry. The wizard's
// Route fields are otherwise dead: cf v8 push reads routes only from the
// manifest (there is no host/domain flag), and the file is never rewritten
// between fetch and push.
//
// Semantics: override-wins. When a route can be composed from the override
// (host.domain/path) it REPLACES the first application's route set and strips
// the deprecated route keys. The manifest is left byte-for-byte untouched when
// no-route/random-route is set, or when no route can be composed (no domain to
// attach a host/path to).
//
// The v8 manifestparser is used for the round-trip so that (a) the rewrite is
// parsed identically by the push and (b) fields the parser does not model
// (processes, sidecars, metadata, services, ...) survive via its inline
// RemainingManifestFields map.
func applyRouteOverride(manifestPath string, overrides CFPushAppOverrides) error {
	// no-route / random-route mean "no specific route"; the wizard disables
	// the address fields in those modes, so any leftover host/domain/path
	// value must not be turned into a route here.
	if overrides.NoRoute || overrides.RandomRoute {
		return nil
	}

	route := composeRoute(overrides.Host, overrides.Domain, overrides.Path)
	if route == "" {
		return nil
	}

	raw, err := os.ReadFile(manifestPath)
	if err != nil {
		return err
	}

	parser := manifestparser.ManifestParser{}
	manifest, err := parser.ParseManifest(manifestPath, raw)
	if err != nil {
		return err
	}

	app := manifest.GetFirstApp()
	if app.RemainingManifestFields == nil {
		app.RemainingManifestFields = map[string]interface{}{}
	}
	app.RemainingManifestFields["routes"] = []map[string]interface{}{{"route": route}}
	for _, key := range deprecatedRouteKeys {
		delete(app.RemainingManifestFields, key)
	}

	out, err := parser.MarshalManifest(manifest)
	if err != nil {
		return err
	}

	return os.WriteFile(manifestPath, out, 0600)
}
