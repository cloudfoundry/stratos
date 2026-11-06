package cfapppush

import (
	"os"
	"os/exec"
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

// CVE-2017-1000117 class hardening (FWT-922):
//
// git invocations are built by strings.Fields-splitting a template and then
// substituting {repo}, {branch}, {commit} into the resulting argv slots. No
// shell is involved, but a single argv element that begins with "-" or "--"
// is interpreted by git as an option rather than a positional. A "--"
// separator before positional values forces git to treat everything after as
// positional regardless of content, closing the whole option-smuggle class.
//
// These tests pin the template shape so a future refactor can't silently
// re-open the vector. They assert the textual contract, not the observable
// behavior of forking git — that is out of scope for a unit test.

func TestCreateCmdTemplateIncludesArgumentSeparator(t *testing.T) {
	if len(vcsGit.createCmd) != 1 {
		t.Fatalf("expected exactly one createCmd template, got %d", len(vcsGit.createCmd))
	}
	tmpl := vcsGit.createCmd[0]
	if !strings.Contains(tmpl, " -- {repo}") {
		t.Errorf("expected createCmd template to place '--' immediately before {repo} to force positional parsing, got %q", tmpl)
	}
}

func TestResetToCommitCmdTemplateIncludesArgumentSeparator(t *testing.T) {
	if len(vcsGit.resetToCommitCmd) != 1 {
		t.Fatalf("expected exactly one resetToCommitCmd template, got %d", len(vcsGit.resetToCommitCmd))
	}
	tmpl := vcsGit.resetToCommitCmd[0]
	// reset's {commit} is a revision, not a path: "--end-of-options" stops
	// option parsing without turning the value into a pathspec (which "--"
	// would, breaking "reset --hard"). See FWT-922.
	if !strings.Contains(tmpl, "--end-of-options {commit}") {
		t.Errorf("expected resetToCommitCmd template to place '--end-of-options' immediately before {commit} to force positional parsing, got %q", tmpl)
	}
}

func TestCreateCmdArgv_UserControlledRepoStaysPositional(t *testing.T) {
	// Simulate the argv assembly that run1 performs: strings.Fields on the
	// template, then per-slot placeholder substitution. This mirrors lines
	// 129-132 of vcs.go. A crafted repo value of --upload-pack=evil must not
	// collide with git options thanks to the "--" separator.
	template := vcsGit.createCmd[0]
	args := strings.Fields(template)

	substitutions := map[string]string{
		"sslVerify": "true",
		"branch":    "main",
		"repo":      "--upload-pack=evil",
		"dir":       "/tmp/workdir",
	}
	for i, a := range args {
		args[i] = expand(substitutions, a)
	}

	sepIdx := -1
	repoIdx := -1
	for i, a := range args {
		if a == "--" && sepIdx == -1 {
			sepIdx = i
		}
		if a == "--upload-pack=evil" {
			repoIdx = i
		}
	}
	if sepIdx == -1 {
		t.Fatalf("expected a literal '--' argv element in the assembled argv, got %v", args)
	}
	if repoIdx == -1 {
		t.Fatalf("expected the crafted repo value to appear as its own argv element, got %v", args)
	}
	if repoIdx <= sepIdx {
		t.Errorf("expected '--upload-pack=evil' to appear AFTER the '--' separator so git treats it as a positional URL; separator at %d, repo at %d, argv=%v", sepIdx, repoIdx, args)
	}
}

func TestResetToCommitCmdArgv_UserControlledCommitStaysPositional(t *testing.T) {
	template := vcsGit.resetToCommitCmd[0]
	args := strings.Fields(template)

	substitutions := map[string]string{"commit": "-exec=evil"}
	for i, a := range args {
		args[i] = expand(substitutions, a)
	}

	sepIdx := -1
	commitIdx := -1
	for i, a := range args {
		if a == "--end-of-options" && sepIdx == -1 {
			sepIdx = i
		}
		if a == "-exec=evil" {
			commitIdx = i
		}
	}
	if sepIdx == -1 {
		t.Fatalf("expected a literal '--end-of-options' argv element in the assembled argv, got %v", args)
	}
	if commitIdx == -1 {
		t.Fatalf("expected the crafted commit value to appear as its own argv element, got %v", args)
	}
	if commitIdx <= sepIdx {
		t.Errorf("expected '-exec=evil' to appear AFTER the '--end-of-options' separator so git treats it as a positional commit; separator at %d, commit at %d, argv=%v", sepIdx, commitIdx, args)
	}
}

// Behavioral guard: ResetBranchToCommit must actually move HEAD to an
// arbitrary historical commit. The template-only tests above never forked
// git, so they missed that a plain "--" separator makes git treat the SHA as
// a pathspec ("fatal: Cannot do hard reset with paths" → exit 128). This runs
// real git to prove the reset works end to end.
func TestResetBranchToCommit_MovesHeadToHistoricalCommit(t *testing.T) {
	if _, err := exec.LookPath("git"); err != nil {
		t.Skip("git not available on PATH")
	}
	dir := t.TempDir()

	git := func(args ...string) string {
		t.Helper()
		cmd := exec.Command("git", args...)
		cmd.Dir = dir
		cmd.Env = append(os.Environ(),
			"GIT_AUTHOR_NAME=t", "GIT_AUTHOR_EMAIL=t@t.io",
			"GIT_COMMITTER_NAME=t", "GIT_COMMITTER_EMAIL=t@t.io",
		)
		out, err := cmd.CombinedOutput()
		if err != nil {
			t.Fatalf("git %v failed: %v\n%s", args, err, out)
		}
		return strings.TrimSpace(string(out))
	}

	git("init", "-q")
	git("commit", "-q", "--allow-empty", "-m", "c1")
	target := git("rev-parse", "HEAD")
	git("commit", "-q", "--allow-empty", "-m", "c2")
	git("commit", "-q", "--allow-empty", "-m", "c3")

	if err := vcsGit.ResetBranchToCommit(dir, target); err != nil {
		t.Fatalf("ResetBranchToCommit returned error: %v", err)
	}

	if head := git("rev-parse", "HEAD"); head != target {
		t.Errorf("expected HEAD to be reset to %s, got %s", target, head)
	}
}
