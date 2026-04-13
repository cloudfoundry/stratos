package cfapppush

// Based on https://github.com/golang/go/blob/master/src/cmd/go/internal/get/vcs.go

import (
	"bytes"
	"fmt"
	"net/url"
	"os"
	"os/exec"
	"strconv"
	"strings"

	log "github.com/sirupsen/logrus"
)

var vcsGit = &vcsCmd{
	name:             "Git",
	cmd:              "git",
	accessToken:      "",
	createCmd:        []string{"clone -c http.sslVerify={sslVerify} -b {branch} {repo} {dir} "},
	resetToCommitCmd: []string{"reset --hard {commit}"},
	checkoutCmd:      []string{"checkout refs/remotes/origin/{branch}"},
	headCmd:          []string{"rev-parse HEAD"},
}

type vcsOptions func(*vcsCmd)

// GetVCS returns a vcsCmd configured with the supplied options. Currently only git is supported.
// Options are applied to a copy of the package-level vcsGit prototype so concurrent callers
// don't race on a shared mutable access token.
func GetVCS(opts ...vcsOptions) *vcsCmd {
	c := *vcsGit
	for _, opt := range opts {
		opt(&c)
	}
	return &c
}

func withAccessToken(accessToken string) vcsOptions {
	return func(vc *vcsCmd) {
		vc.accessToken = accessToken
	}
}

type vcsCmd struct {
	name        string
	cmd         string // name of binary to invoke command
	accessToken string // optional; when set, embedded as x-access-token basic auth in the clone URL

	createCmd        []string // commands to download a fresh copy of a repository
	checkoutCmd      []string // commands to checkout a branch
	headCmd          []string // get current head commit
	resetToCommitCmd []string // reset branch to commit
}

func (vcs *vcsCmd) Create(skipSSL bool, dir string, repo string, branch string) error {
	authenticatedRepo, err := vcs.repoWithToken(repo)
	if err != nil {
		return err
	}

	for _, cmd := range vcs.createCmd {
		if err := vcs.run(".", cmd, "sslVerify", strconv.FormatBool(!skipSSL), "dir", dir, "repo", authenticatedRepo, "branch", branch); err != nil {
			return err
		}
	}
	return nil
}

// repoWithToken rewrites a git repository URL to embed the configured access
// token as basic-auth credentials. When no access token is set it returns the
// URL unchanged. Extracted from Create() so the rewrite can be unit-tested
// without shelling out to a real git binary.
func (vcs *vcsCmd) repoWithToken(repo string) (string, error) {
	if len(vcs.accessToken) == 0 {
		return repo, nil
	}
	repoURL, err := url.Parse(repo)
	if err != nil {
		return "", fmt.Errorf("could not parse repo URL for authenticated clone: %w", err)
	}
	repoURL.User = url.UserPassword("x-access-token", vcs.accessToken)
	return repoURL.String(), nil
}

func (vcs *vcsCmd) ResetBranchToCommit(dir string, commit string) error {
	for _, cmd := range vcs.resetToCommitCmd {
		if err := vcs.run(dir, cmd, "commit", commit); err != nil {
			return err
		}
	}
	return nil
}

func (vcs *vcsCmd) Checkout(dir string, branchRef string) error {
	for _, cmd := range vcs.checkoutCmd {
		if err := vcs.run(dir, cmd, "branch", branchRef); err != nil {
			log.Warnf("checkout error was: %s", err)
			return err
		}
	}
	return nil
}

func (vcs *vcsCmd) Head(dir string) (string, error) {
	var emptySlice []string
	for _, cmd := range vcs.headCmd {
		hash, err := vcs.run1(dir, cmd, emptySlice, false)
		if err != nil {
			return "", err
		}
		return string(hash), nil
	}
	return "", nil
}

func (v *vcsCmd) run(dir string, cmd string, keyval ...string) error {
	_, err := v.run1(dir, cmd, keyval, true)
	return err
}

func (v *vcsCmd) run1(dir string, cmdline string, keyval []string, verbose bool) ([]byte, error) {

	m := make(map[string]string)
	for i := 0; i < len(keyval); i += 2 {
		m[keyval[i]] = keyval[i+1]
	}
	args := strings.Fields(cmdline)
	for i, arg := range args {
		args[i] = expand(m, arg)
	}

	_, err := exec.LookPath(v.cmd)
	if err != nil {
		log.Warnf("Missing command. Make sure %s is in your path", v.cmd)
		return nil, err
	}

	cmd := exec.Command(v.cmd, args...)
	cmd.Dir = dir
	cmd.Env = EnvForDir(cmd.Dir, os.Environ())

	var buf bytes.Buffer
	cmd.Stdout = &buf
	cmd.Stderr = &buf
	err = cmd.Run()
	out := buf.Bytes()
	if err != nil {
		return out, err
	}
	return out, nil
}

func expand(match map[string]string, s string) string {
	for k, v := range match {
		s = strings.Replace(s, "{"+k+"}", v, -1)
	}
	return s
}

func EnvForDir(dir string, base []string) []string {
	return MergeEnvLists([]string{"PWD=" + dir}, base)
}

func MergeEnvLists(in, out []string) []string {
	out = append([]string(nil), out...)
NextVar:
	for _, inkv := range in {
		k := strings.SplitAfterN(inkv, "=", 2)[0]
		for i, outkv := range out {
			if strings.HasPrefix(outkv, k) {
				out[i] = inkv
				continue NextVar
			}
		}
		out = append(out, inkv)
	}
	return out
}
