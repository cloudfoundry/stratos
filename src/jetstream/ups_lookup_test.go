package main

import (
	"testing"

	cfenv "github.com/cloudfoundry-community/go-cfenv"
)

func TestUPSLookupReadsTheNamedServiceCredentials(t *testing.T) {
	app := &cfenv.App{Services: cfenv.Services{
		"user-provided": {
			{Name: "other-ups", Credentials: map[string]interface{}{"DB_HOST": "wrong"}},
			{Name: "stratos-ups", Credentials: map[string]interface{}{
				"DB_HOST": "db.example",
				"DB_PORT": 5432,
				"FLAG":    true,
			}},
		},
	}}
	lookup := upsLookup(app, "stratos-ups")

	// Credentials are JSON values; the lookup hands them back as strings.
	for name, want := range map[string]string{"DB_HOST": "db.example", "DB_PORT": "5432", "FLAG": "true"} {
		if got, ok := lookup(name); !ok || got != want {
			t.Errorf("lookup(%s) = %q, %v; want %q", name, got, ok, want)
		}
	}
	if got, ok := lookup("MISSING"); ok {
		t.Errorf("lookup(MISSING) = %q, true; want not found", got)
	}
}

func TestUPSLookupFindsNothingWithoutTheService(t *testing.T) {
	app := &cfenv.App{Services: cfenv.Services{}}
	for _, lookup := range []func(string) (string, bool){
		upsLookup(nil, "stratos-ups"),
		upsLookup(app, "stratos-ups"),
		upsLookup(app, ""),
	} {
		if got, ok := lookup("DB_HOST"); ok {
			t.Errorf("lookup(DB_HOST) = %q, true; want not found", got)
		}
	}
}
