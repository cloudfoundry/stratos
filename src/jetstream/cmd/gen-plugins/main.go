// gen-plugins reads plugin-config.yaml and generates extra_plugins.go
// with the blank imports needed to compile each plugin into the binary.
//
// Usage: go generate ./...   (from src/jetstream)
package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"gopkg.in/yaml.v2"
)

const modulePath = "github.com/cloudfoundry/stratos/src/jetstream/plugins"

type config struct {
	Plugins []string `yaml:"plugins"`
}

func main() {
	root := filepath.Join(".", "plugin-config.yaml")
	data, err := os.ReadFile(root)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %v\n", err)
		os.Exit(1)
	}

	var cfg config
	if err := yaml.Unmarshal(data, &cfg); err != nil {
		fmt.Fprintf(os.Stderr, "error parsing plugin-config.yaml: %v\n", err)
		os.Exit(1)
	}

	// Validate each plugin directory exists
	for _, name := range cfg.Plugins {
		dir := filepath.Join("plugins", name)
		if info, err := os.Stat(dir); err != nil || !info.IsDir() {
			fmt.Fprintf(os.Stderr, "warning: plugin directory not found: %s\n", dir)
		}
	}

	// Build the generated file
	var b strings.Builder
	b.WriteString("package main\n\n")
	b.WriteString("// This file is auto-generated - DO NOT EDIT\n\n")
	for _, name := range cfg.Plugins {
		fmt.Fprintf(&b, "import _ \"%s/%s\"\n", modulePath, name)
	}

	if err := os.WriteFile("extra_plugins.go", []byte(b.String()), 0644); err != nil {
		fmt.Fprintf(os.Stderr, "error writing extra_plugins.go: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("Generated extra_plugins.go with %d plugins\n", len(cfg.Plugins))
	for _, name := range cfg.Plugins {
		fmt.Printf("  + %s\n", name)
	}
}
