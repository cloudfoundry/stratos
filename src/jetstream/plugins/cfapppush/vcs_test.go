package cfapppush

import (
	"strings"
	"testing"
)

func TestRepoWithToken_NoTokenReturnsURLUnchanged(t *testing.T) {
	vcs := &vcsCmd{accessToken: ""}

	out, err := vcs.repoWithToken("https://github.com/org/repo.git")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if out != "https://github.com/org/repo.git" {
		t.Errorf("expected URL to be unchanged when no token is set, got %q", out)
	}
}

func TestRepoWithToken_EmbedsTokenAsBasicAuth(t *testing.T) {
	vcs := &vcsCmd{accessToken: "ghp_testtoken123"}

	out, err := vcs.repoWithToken("https://github.example.com/org/repo.git")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	if !strings.Contains(out, "x-access-token:ghp_testtoken123@github.example.com") {
		t.Errorf("expected URL to contain x-access-token basic-auth, got %q", out)
	}
	if !strings.HasPrefix(out, "https://") {
		t.Errorf("expected URL to preserve https scheme, got %q", out)
	}
	if !strings.HasSuffix(out, "/org/repo.git") {
		t.Errorf("expected URL to preserve path, got %q", out)
	}
}

func TestRepoWithToken_InvalidURLReturnsError(t *testing.T) {
	vcs := &vcsCmd{accessToken: "ghp_testtoken123"}

	// net/url accepts a lot — use a control character to force a parse error.
	_, err := vcs.repoWithToken("https://\x7fexample.com/repo.git")
	if err == nil {
		t.Fatal("expected error on invalid URL, got nil")
	}
	if !strings.Contains(err.Error(), "could not parse repo URL") {
		t.Errorf("expected error to mention 'could not parse repo URL', got %v", err)
	}
}

func TestRepoWithToken_SpecialCharactersInTokenEscaped(t *testing.T) {
	// A token containing URL-special chars (@, :, /, etc.) must be
	// percent-encoded so downstream git clone doesn't misparse it.
	vcs := &vcsCmd{accessToken: "abc@def:ghi/jkl"}

	out, err := vcs.repoWithToken("https://github.example.com/org/repo.git")
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}
	// Raw "@" in the token would end the userinfo section prematurely and
	// point git at the wrong host. Percent-encoding prevents that.
	if strings.Contains(out, "abc@def") {
		t.Errorf("expected token special-chars to be percent-encoded, got %q", out)
	}
	// URL-encoded "@" is %40
	if !strings.Contains(out, "abc%40def") {
		t.Errorf("expected token to be percent-encoded, got %q", out)
	}
}

func TestGetVCS_ReturnsFreshCopyNotPrototype(t *testing.T) {
	// GetVCS must return a copy so callers can't mutate the package-level
	// prototype and poison subsequent unrelated git operations.
	a := GetVCS(withAccessToken("token-a"))
	b := GetVCS() // no options

	if b.accessToken != "" {
		t.Errorf("expected b.accessToken to be empty (no options applied), got %q", b.accessToken)
	}
	if a.accessToken != "token-a" {
		t.Errorf("expected a.accessToken to be 'token-a', got %q", a.accessToken)
	}
	// Mutating a must not affect b
	a.accessToken = "mutated"
	if b.accessToken == "mutated" {
		t.Error("mutation on one GetVCS() result leaked into another call")
	}
	// Prototype must also be untouched
	if vcsGit.accessToken != "" {
		t.Errorf("package-level vcsGit prototype was mutated; accessToken=%q", vcsGit.accessToken)
	}
}

func TestGetVCS_WithAccessTokenOption(t *testing.T) {
	vcs := GetVCS(withAccessToken("token-xyz"))

	if vcs.accessToken != "token-xyz" {
		t.Errorf("expected accessToken to be 'token-xyz', got %q", vcs.accessToken)
	}
	// Other fields should still be populated from the prototype
	if vcs.name != "Git" {
		t.Errorf("expected name to be 'Git', got %q", vcs.name)
	}
	if vcs.cmd != "git" {
		t.Errorf("expected cmd to be 'git', got %q", vcs.cmd)
	}
	if len(vcs.createCmd) == 0 {
		t.Error("expected createCmd to be populated from prototype, got empty slice")
	}
}
