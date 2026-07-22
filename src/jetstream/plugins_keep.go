//go:build tools
// +build tools

// This file is never compiled into the jetstream binary (the `tools` build
// tag excludes it from every normal build/test). Its sole purpose is to keep
// the local plugin modules — the ones with their own go.mod and a `replace`
// directive in this module's go.mod — present in the require graph.
//
// Those modules are otherwise imported only by extra_plugins.go, which is
// generated from plugin-config.yaml and deliberately gitignored so each
// deployment can pick its own plugin set. On any checkout where generation
// has not run yet — dependabot, a fresh clone, an IDE before `go generate` —
// `go mod tidy` would not see those imports, prune their `require` lines while
// the `replace` directives remain, and fail every backend build with:
//
//	module .../plugins/cfapppush ... is replaced but not required
//
// Blank-importing each replaced module here pins the requires regardless of
// extra_plugins.go, without compiling any plugin into the binary. What a
// deployment actually runs is still controlled solely by extra_plugins.go.
// See docs/plugin-architecture.md.

package main

import (
	_ "github.com/cloudfoundry/stratos/src/jetstream/plugins/cfapppush"
	_ "github.com/cloudfoundry/stratos/src/jetstream/plugins/kubernetes" // keeps kubernetes/auth transitively
	_ "github.com/cloudfoundry/stratos/src/jetstream/plugins/monocular"
)
