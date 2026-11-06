// Package env reads configuration values from an ordered list of sources:
// the database-stored console config, the process environment, a CF
// user-provided service, config.properties and /etc/secrets. The first
// source that has a name wins.
//
// It replaces github.com/govau/cf-common/env (unmaintained since 2020),
// keeping the API jetstream calls so call sites only change their import.
package env

import (
	"fmt"
	"strconv"
)

// Lookup returns the value for name and whether it was found.
type Lookup func(name string) (string, bool)

// NoopLookup finds nothing. It stands in for a source that does not apply,
// such as a config file that is not there.
func NoopLookup(string) (string, bool) {
	return "", false
}

// VarSet searches its sources in the order they were added.
type VarSet struct {
	sources []Lookup
}

// VarSetOpt configures a VarSet when it is made.
type VarSetOpt func(*VarSet)

// NewVarSet makes a VarSet from opts.
func NewVarSet(opts ...VarSetOpt) *VarSet {
	v := &VarSet{}
	for _, opt := range opts {
		opt(v)
	}
	return v
}

// WithMapLookup adds m as a source.
func WithMapLookup(m map[string]string) VarSetOpt {
	return func(v *VarSet) {
		v.AppendSource(func(name string) (string, bool) {
			val, ok := m[name]
			return val, ok
		})
	}
}

// AppendSource adds s after every existing source.
func (v *VarSet) AppendSource(s Lookup) *VarSet {
	v.sources = append(v.sources, s)
	return v
}

// Lookup returns the value from the first source that has name.
func (v *VarSet) Lookup(name string) (string, bool) {
	for _, lookup := range v.sources {
		if val, ok := lookup(name); ok {
			return val, true
		}
	}
	return "", false
}

// IsSet reports whether any source has name. An empty value counts as set.
func (v *VarSet) IsSet(name string) bool {
	_, ok := v.Lookup(name)
	return ok
}

// String returns the value for name, or defaultVal when no source has it.
func (v *VarSet) String(name, defaultVal string) string {
	if val, ok := v.Lookup(name); ok {
		return val
	}
	return defaultVal
}

// MustString returns the value for name and panics when no source has it.
func (v *VarSet) MustString(name string) string {
	val, ok := v.Lookup(name)
	if !ok {
		panic(fmt.Errorf("environment variable with name %q not found", name))
	}
	return val
}

// MustBool returns the value for name parsed by strconv.ParseBool. Unset is
// false, as with a command-line flag; a value that does not parse panics.
func (v *VarSet) MustBool(name string) bool {
	val, ok := v.Lookup(name)
	if !ok {
		return false
	}
	b, err := strconv.ParseBool(val)
	if err != nil {
		panic(fmt.Errorf("environment variable with name %q could not be parsed", name))
	}
	return b
}
