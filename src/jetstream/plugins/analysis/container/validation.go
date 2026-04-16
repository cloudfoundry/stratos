package main

import (
	"errors"
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

// DNS-1123 label: lowercase alphanumeric and '-', starting and ending with
// an alphanumeric character, 1..63 characters total. Matches the Kubernetes
// namespace naming rule enforced server-side by the API; validating here
// ensures an attacker cannot bypass the UI's namespace picker and smuggle a
// shell payload into kubescore-runner.sh (FWT-923).
var namespaceRE = regexp.MustCompile(`^[a-z0-9]([-a-z0-9]*[a-z0-9])?$`)

const namespaceMaxLen = 63

// validateNamespace returns nil for an empty value (meaning "--all-namespaces"
// downstream) or for any name that matches the DNS-1123 label rule. Every
// other value — shell metacharacters, path separators, uppercase letters,
// leading/trailing dashes, over-length — is rejected.
func validateNamespace(ns string) error {
	if ns == "" {
		return nil
	}
	if len(ns) > namespaceMaxLen {
		return fmt.Errorf("namespace exceeds %d characters", namespaceMaxLen)
	}
	if !namespaceRE.MatchString(ns) {
		return fmt.Errorf("namespace %q does not match Kubernetes DNS-1123 label rule", ns)
	}
	return nil
}

// validateContentID takes a multipart Content-ID header value and a parent
// directory, returns a sanitised absolute path confined to parent. Rejects
// any filename containing a path separator, `..`, an empty name, or anything
// else that filepath.Clean + prefix-check doesn't confirm lives under parent.
// Closes the arbitrary-file-write vector in run.go (FWT-923).
func validateContentID(filename, parent string) (string, error) {
	if filename == "" {
		return "", errors.New("empty filename")
	}
	if strings.ContainsAny(filename, `/\`) {
		return "", fmt.Errorf("filename %q contains a path separator", filename)
	}
	if filename == "." || filename == ".." {
		return "", fmt.Errorf("filename %q is reserved", filename)
	}
	cleanedParent := filepath.Clean(parent)
	fullPath := filepath.Join(cleanedParent, filename)
	// Belt-and-braces: even though we reject separators above, re-check that
	// the resolved path still begins with the parent directory. A future
	// refactor that loosens the separator check would still be caught here.
	if !strings.HasPrefix(fullPath, cleanedParent+string(filepath.Separator)) {
		return "", fmt.Errorf("filename %q escapes the parent directory", filename)
	}
	return fullPath, nil
}
