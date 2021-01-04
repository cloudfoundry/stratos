package cfapppush

// Based on https://github.com/golang/go/blob/master/src/cmd/go/internal/get/vcs.go

import (
	"bytes"
	"os"
	"os/exec"
	"strconv"
	"strings"

	log "github.com/sirupsen/logrus"
)

var vcsGit = &vcsCmd{
	name:             "Git",
	cmd:              "git",
	createCmd:        []string{"clone -c http.sslVerify={sslVerify} -b {branch} {repo} {dir} "},
	resetToCommitCmd: []string{"reset --hard {commit}"},
	checkoutCmd:      []string{"checkout refs/remotes/origin/{branch}"},
	headCmd:          []string{"rev-parse HEAD"},
}

// Currently only git is supported
func GetVCS() *vcsCmd {
	return vcsGit
}

type vcsCmd struct {
	name string
	cmd  string // name of binary to invoke command

	createCmd        []string // commands to download a fresh copy of a repository
	checkoutCmd      []string // commands to checkout a branch
	headCmd          []string // get current head commit
	resetToCommitCmd []string // reset branch to commit
}

func (vcs *vcsCmd) Create(skipSSL bool, dir string, repo string, branch string) error {
	for _, cmd := range vcs.createCmd {
		if err := vcs.run(".", cmd, "sslVerify", strconv.FormatBool(!skipSSL), "dir", dir, "repo", repo, "branch", branch); err != nil {
			return err
		}
	}
	return nil
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
