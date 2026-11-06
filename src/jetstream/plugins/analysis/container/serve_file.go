package main

import (
	"os"
	"path/filepath"

	"github.com/labstack/echo/v5"
)

// serveFile serves a file that may live outside the process working
// directory.
//
// Echo v4 read the file with os.Open, so any path worked. Echo v5 resolves
// Context.File through echo.Filesystem, which is rooted at the working
// directory and accepts an absolute path only when it lives beneath that
// directory (echo.defaultFS.Open). ANALYSIS_REPORTS_DIR is an absolute path,
// so whether a report could be read back depended on where the process
// happened to be started from.
//
// Serving the base name out of the file's own directory restores the v4
// behaviour for every path shape while keeping Echo's own handling (content
// type, modification time, range requests). It is also tighter than v4: the
// read is confined to that one directory.
func serveFile(ec *echo.Context, file string) error {
	dir, base := filepath.Split(file)
	if dir == "" {
		dir = "."
	}
	return ec.FileFS(base, os.DirFS(dir))
}
