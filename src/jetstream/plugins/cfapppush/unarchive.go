package cfapppush

import (
	"context"
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"

	"github.com/mholt/archives"
)

// unarchive extracts the archive at src into dst. Entries (and symlink
// targets) that would resolve outside dst are rejected (Zip Slip).
func unarchive(src, dst string) error {
	f, err := os.Open(src)
	if err != nil {
		return err
	}
	defer func() { _ = f.Close() }()

	ctx := context.Background()
	format, input, err := archives.Identify(ctx, src, f)
	if err != nil {
		return err
	}
	extractor, ok := format.(archives.Extractor)
	if !ok {
		return fmt.Errorf("unsupported archive format: %s", format.Extension())
	}

	return extractor.Extract(ctx, input, func(ctx context.Context, entry archives.FileInfo) error {
		name := filepath.FromSlash(entry.NameInArchive)
		if !filepath.IsLocal(name) {
			return fmt.Errorf("archive entry escapes extraction directory: %s", entry.NameInArchive)
		}
		target := filepath.Join(dst, name)

		switch {
		case entry.IsDir():
			return os.MkdirAll(target, dirMode(entry.Mode().Perm()))
		case entry.LinkTarget != "":
			link := filepath.FromSlash(entry.LinkTarget)
			if filepath.IsAbs(link) || !filepath.IsLocal(filepath.Join(filepath.Dir(name), link)) {
				return fmt.Errorf("archive symlink escapes extraction directory: %s -> %s", entry.NameInArchive, entry.LinkTarget)
			}
			if err := os.MkdirAll(filepath.Dir(target), 0700); err != nil {
				return err
			}
			return os.Symlink(link, target)
		default:
			if err := os.MkdirAll(filepath.Dir(target), 0700); err != nil {
				return err
			}
			mode := entry.Mode().Perm()
			// A zero mode means the archive entry recorded no permission
			// bits; fall back to owner read/write.
			if mode == 0 {
				mode = 0600
			}
			out, err := os.OpenFile(target, os.O_WRONLY|os.O_CREATE|os.O_TRUNC, mode)
			if err != nil {
				return err
			}
			in, err := entry.Open()
			if err != nil {
				// Join rather than drop the close error - the open failure
				// matters more, but a failed close is still worth surfacing
				return errors.Join(err, out.Close())
			}
			defer func() { _ = in.Close() }()
			_, err = io.Copy(out, in)
			// Close errors on a written file can mean lost data - don't drop them
			if closeErr := out.Close(); err == nil {
				err = closeErr
			}
			return err
		}
	})
}

// dirMode ensures extracted directories remain writable during extraction.
func dirMode(perm os.FileMode) os.FileMode {
	if perm == 0 {
		return 0700
	}
	return perm | 0700
}
