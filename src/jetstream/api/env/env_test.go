package env

import (
	"strings"
	"testing"
)

func TestLookupSearchesSourcesInOrder(t *testing.T) {
	v := NewVarSet(
		WithMapLookup(map[string]string{"A": "first"}),
		WithMapLookup(map[string]string{"A": "second", "B": "only-second"}),
	)

	if got, ok := v.Lookup("A"); !ok || got != "first" {
		t.Errorf("Lookup(A) = %q, %v; want the first source's value", got, ok)
	}
	if got, ok := v.Lookup("B"); !ok || got != "only-second" {
		t.Errorf("Lookup(B) = %q, %v; want a fall-through to the second source", got, ok)
	}
	if got, ok := v.Lookup("C"); ok || got != "" {
		t.Errorf("Lookup(C) = %q, %v; want not found", got, ok)
	}
}

func TestAppendSourceAddsAfterExistingSources(t *testing.T) {
	v := NewVarSet(WithMapLookup(map[string]string{"A": "map"}))
	v.AppendSource(func(name string) (string, bool) { return "appended", true })

	if got := v.String("A", ""); got != "map" {
		t.Errorf("String(A) = %q; an appended source must not override an earlier one", got)
	}
	if got := v.String("Z", ""); got != "appended" {
		t.Errorf("String(Z) = %q; want the appended source's value", got)
	}
}

func TestEmptyValueCountsAsSet(t *testing.T) {
	v := NewVarSet(WithMapLookup(map[string]string{"EMPTY": ""}))

	if !v.IsSet("EMPTY") {
		t.Error("IsSet(EMPTY) = false; a variable set to the empty string is set")
	}
	if got := v.String("EMPTY", "default"); got != "" {
		t.Errorf("String(EMPTY) = %q; the default applies only when unset", got)
	}
	if v.IsSet("MISSING") {
		t.Error("IsSet(MISSING) = true")
	}
	if got := v.String("MISSING", "default"); got != "default" {
		t.Errorf("String(MISSING) = %q; want the default", got)
	}
}

func TestNoopLookupFindsNothing(t *testing.T) {
	if got, ok := NoopLookup("ANY"); ok || got != "" {
		t.Errorf("NoopLookup = %q, %v", got, ok)
	}
	if NewVarSet().IsSet("ANY") {
		t.Error("a VarSet with no sources reported a variable as set")
	}
}

func TestMustString(t *testing.T) {
	v := NewVarSet(WithMapLookup(map[string]string{"A": "value"}))
	if got := v.MustString("A"); got != "value" {
		t.Errorf("MustString(A) = %q", got)
	}
	expectPanic(t, `"MISSING" not found`, func() { v.MustString("MISSING") })
}

func TestMustBool(t *testing.T) {
	v := NewVarSet(WithMapLookup(map[string]string{"T": "true", "ONE": "1", "F": "false", "BAD": "yes-ish"}))

	for name, want := range map[string]bool{"T": true, "ONE": true, "F": false, "UNSET": false} {
		if got := v.MustBool(name); got != want {
			t.Errorf("MustBool(%s) = %v; want %v", name, got, want)
		}
	}
	expectPanic(t, `"BAD" could not be parsed`, func() { v.MustBool("BAD") })
}

func expectPanic(t *testing.T, wantMsg string, f func()) {
	t.Helper()
	defer func() {
		t.Helper()
		r := recover()
		err, ok := r.(error)
		if !ok {
			t.Fatalf("recovered %v; want a panic carrying an error", r)
		}
		if !strings.Contains(err.Error(), wantMsg) {
			t.Errorf("panic error %q; want it to mention %q", err, wantMsg)
		}
	}()
	f()
}
