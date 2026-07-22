package cfapppush

import (
	"archive/tar"
	"archive/zip"
	"compress/gzip"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeZip(t *testing.T, entries map[string]string) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "test.zip")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	defer f.Close()
	w := zip.NewWriter(f)
	for name, content := range entries {
		fw, err := w.Create(name)
		if err != nil {
			t.Fatal(err)
		}
		if _, err := fw.Write([]byte(content)); err != nil {
			t.Fatal(err)
		}
	}
	if err := w.Close(); err != nil {
		t.Fatal(err)
	}
	return path
}

func TestUnarchiveZip(t *testing.T) {
	src := writeZip(t, map[string]string{
		"manifest.yml":   "applications: []",
		"app/index.html": "<html></html>",
	})
	dst := t.TempDir()
	if err := unarchive(src, dst); err != nil {
		t.Fatalf("unarchive failed: %v", err)
	}
	got, err := os.ReadFile(filepath.Join(dst, "app", "index.html"))
	if err != nil {
		t.Fatal(err)
	}
	if string(got) != "<html></html>" {
		t.Fatalf("unexpected content: %q", got)
	}
}

func TestUnarchiveTarGz(t *testing.T) {
	path := filepath.Join(t.TempDir(), "test.tar.gz")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	gw := gzip.NewWriter(f)
	tw := tar.NewWriter(gw)
	content := "applications: []"
	if err := tw.WriteHeader(&tar.Header{Name: "manifest.yml", Mode: 0644, Size: int64(len(content))}); err != nil {
		t.Fatal(err)
	}
	if _, err := tw.Write([]byte(content)); err != nil {
		t.Fatal(err)
	}
	for _, c := range []interface{ Close() error }{tw, gw, f} {
		if err := c.Close(); err != nil {
			t.Fatal(err)
		}
	}

	dst := t.TempDir()
	if err := unarchive(path, dst); err != nil {
		t.Fatalf("unarchive failed: %v", err)
	}
	if _, err := os.Stat(filepath.Join(dst, "manifest.yml")); err != nil {
		t.Fatal(err)
	}
}

func TestUnarchiveRejectsZipSlip(t *testing.T) {
	src := writeZip(t, map[string]string{
		"../evil.txt": "escaped",
	})
	dst := t.TempDir()
	err := unarchive(src, dst)
	if err == nil || !strings.Contains(err.Error(), "escapes extraction directory") {
		t.Fatalf("expected zip-slip rejection, got: %v", err)
	}
	if _, statErr := os.Stat(filepath.Join(filepath.Dir(dst), "evil.txt")); statErr == nil {
		t.Fatal("zip-slip entry was written outside extraction directory")
	}
}

func TestUnarchiveRejectsEscapingSymlink(t *testing.T) {
	path := filepath.Join(t.TempDir(), "test.tar")
	f, err := os.Create(path)
	if err != nil {
		t.Fatal(err)
	}
	tw := tar.NewWriter(f)
	if err := tw.WriteHeader(&tar.Header{
		Name:     "link",
		Typeflag: tar.TypeSymlink,
		Linkname: "../../etc/passwd",
		Mode:     0777,
	}); err != nil {
		t.Fatal(err)
	}
	for _, c := range []interface{ Close() error }{tw, f} {
		if err := c.Close(); err != nil {
			t.Fatal(err)
		}
	}

	dst := t.TempDir()
	err = unarchive(path, dst)
	if err == nil || !strings.Contains(err.Error(), "escapes extraction directory") {
		t.Fatalf("expected symlink rejection, got: %v", err)
	}
}
