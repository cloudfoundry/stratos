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

// validateSegment rejects a single report-path route parameter
// (user/endpoint/id/file) that is empty, contains a path separator, or is
// "." / "..". Each parameter forms one directory level under reportsDir;
// without this a bare ".." parameter traverses out of the reports tree.
// reportPath validates every segment and returns the joined path beneath
// base. It is the only way a report path is built, so a caller cannot
// validate and then join something else by mistake. It is also the point the
// CodeQL model pack declares as a path-injection barrier: the query has no
// hook for a guard function, only for one that returns the confined value.
func reportPath(base string, segs ...string) (string, error) {
	for _, seg := range segs {
		if err := validateSegment(seg); err != nil {
			return "", err
		}
	}
	return filepath.Join(append([]string{base}, segs...)...), nil
}

// jobFolder returns the folder for a job id. The id is a nested "user/endpoint/id"
// path, so it is confined with filepath.IsLocal rather than per-segment.
func jobFolder(base, id string) (string, error) {
	if !filepath.IsLocal(id) {
		return "", fmt.Errorf("job id %q is not a local path", id)
	}
	return filepath.Join(base, id), nil
}

func validateSegment(seg string) error {
	if seg == "" {
		return errors.New("empty path segment")
	}
	if strings.ContainsAny(seg, `/\`) {
		return fmt.Errorf("path segment %q contains a separator", seg)
	}
	if seg == "." || seg == ".." {
		return fmt.Errorf("path segment %q is reserved", seg)
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
