package store

import (
	semver "github.com/Masterminds/semver/v3"
)

// SemanticVersion is a semver with support for a plain text version
// Uses the semver library - which errors if the version can not be parsed
// This wrapper ensures that if a version can not be parsed as a semver
// it is treated as a string

type SemanticVersion struct {
	Version *semver.Version
	Text    string
	Valid   bool
}

// NewSemanticVersion parses and returns a Semantic Version
func NewSemanticVersion(version string) SemanticVersion {

	v := SemanticVersion{
		Text: version,
	}

	sv, err := semver.NewVersion(version)
	v.Version = sv
	v.Valid = err == nil

	return v
}

func (s *SemanticVersion) LessThan(d *SemanticVersion) bool {
	if d == nil {
		return true
	}
	if s.Valid && d.Valid {
		return !s.Version.LessThan(d.Version)
	} else if s.Valid && !d.Valid {
		return true
	} else if !s.Valid && d.Valid {
		return false
	}

	return s.Text < d.Text
}

func (s *SemanticVersion) LessThanReleaseVersions(d *SemanticVersion) bool {
	if d == nil {
		return true
	}
	if s.Valid && d.Valid {
		// Check release versions
		if len(d.Version.Prerelease()) > 0 {
			return true
		}
		return !s.Version.LessThan(d.Version)
	}

	return s.LessThan(d)
}
