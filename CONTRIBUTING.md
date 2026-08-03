# Contributing to Stratos

Stratos is an open project and welcomes contributions. These guidelines are provided to help you understand how the project works and to make contributing smooth and fun for everybody involved.

There are two main forms of contribution: reporting issues and performing code changes.

## Reporting Issues

If you find a problem with Stratos, report it using [GitHub issues](https://github.com/cloudfoundry/stratos/issues/new).

Before reporting a new issue, please take a moment to check whether it has already been reported
[here](https://github.com/cloudfoundry/stratos/issues). If this is the case, please:

- Read all the comments to confirm that it's the same issue you're having.
- Refrain from adding "same thing here" or "+1" comments. Just hit the
  "subscribe" button to get notifications for this issue.
- Add a comment only if you can provide helpful information that has not been
  provided in the discussion yet.

When creating a new issue, make sure you include:

1. As much detail as possible about your setup/environment
1. Steps to reproduce the issue/bug
1. What you expected to happen
1. What happened instead

This information will help to determine the cause and prepare a fix as fast as possible.

## Code Changes

Code contributions come in various forms and sizes, from simple bug fixes to implementation
of new features. Before making any non-trivial change, get in touch with the Stratos developers first. This can prevent wasted effort later.

To send your code change, use GitHub pull requests. The workflow is as follows:

  1. Fork the project.

  1. Create a branch based on `develop`.

  1. Implement your change, including tests and documentation. See
     [Requirements for a change](#requirements-for-a-change) below for what a
     reviewable change has to include.

  1. Run `make check gate` and make sure it passes before you publish.

  1. Publish the branch and create a pull request.

  1. Stratos developers will review your change and possibly point out issues.
     Adapt the code under their guidance until all issues are resolved.

  1. Finally, the pull request will get merged or rejected.

See also [GitHub's guide on contributing](https://help.github.com/articles/fork-a-repo).

If you want to do multiple unrelated changes, use separate branches and pull
requests.

### Requirements for a change

A change is ready for review when all of the following hold. Continuous
integration checks every one of them on your pull request, so running them
locally first saves a round trip.

**Tests.** New functionality must arrive with tests that cover it, and a bug
fix must arrive with a test that fails without the fix. This is the project's
test policy and it applies to every change, not only to large ones: a change
that adds behaviour nothing exercises is not reviewable, because nothing will
tell us when it breaks later.

Tests live beside the code they cover — `*.spec.ts` for the frontend,
`*_test.go` for Jetstream. Run them with:

```bash
make test                 # everything
make test frontend        # the Angular packages only
make test backend         # Jetstream only
```

**The quality gate.** `make check gate` runs lint, the unit tests and a
production build. It must pass before you publish:

```bash
make check gate
```

Lint is not advisory. The gate fails on any ESLint or TypeScript error, and the
project adds its own rules under `tools/eslint-rules/` on top of the standard
sets. Warnings are worth clearing too, even where they do not fail the build.

**Documentation.** If your change alters behaviour an operator or user can
observe — a configuration variable, an API, a header, a screen — update the
documentation in the same pull request. Configuration variables also belong in
`src/jetstream/config.example`.

**A release-notes fragment.** Each pull request carries its own fragment in
`changelog.d/`, written for the person upgrading rather than for the reviewer:

```bash
./build/release-notes.sh new        # names it after your branch
```

See [`changelog.d/README.md`](changelog.d/README.md) for the format. This check
is advisory rather than blocking, because purely internal changes with no
user-visible effect do not need a fragment — but if yours changes anything a
user would notice, add one.

**Sign-off.** Every commit needs a `Signed-off-by` line — see
[Sign your work](#sign-your-work).

### Development environment

| Tool | Version |
|------|---------|
| Node | `^24` or `^26` |
| bun  | `>= 1.3.14` |
| Go   | `1.26.3` |

`bun install` at the repository root sets up the frontend and the build
tooling. `make help` lists every available target.

### Commits

Each commit in the pull request should do only one thing, which is clearly
described by its commit message. Especially avoid mixing formatting changes and
functional changes into one commit. When writing commit messages, adhere to
[widely used
conventions](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

Subjects follow the `type(scope): summary` form used throughout the history —
`feat(jetstream):`, `fix(cloud-foundry):`, `docs:`, `ci:`, `chore(deps):`.
Release tooling reads these prefixes, so keeping to them matters beyond
tidiness.

When the commit fixes a bug, put a message in the body of the commit message
pointing to the number of the issue (e.g. "Fixes #123").

### Pull requests and branches

All work happens in branches. The develop branch is the target for pull
requests; releases are cut from main.

During code review you often need to update pull requests. Usually you do that
by pushing additional commits.

In some cases where the commit history of a pull request gets too cumbersome to
review or you need bigger changes in the way you approach a problem which needs
changing of commits you already did it's more practical to create a new pull
request. This new pull request often will contain squashed versions of the
previous pull request. Use that to clarify the changes contained in a pull
request and to make review easier.

When you replace a pull request by another one, add a message in the
description of the new pull request on GitHub referencing the pull request it
replaces (e.g. "Supersedes #123").

Never force push commits. This changes history, can lead to data loss, and
causes trouble for people who have checked out the changes which are overwritten
by a force push. Don't waste time with thinking about if the force push in this
one particular case would be ok, just don't do it.

### Check for assigned people

We use Github Issues for submitting known issues (e.g. bugs, features,
etc.). Some issues will have someone assigned, meaning that there's already
someone that takes responsibility for fixing the issue. This is not done to
discourage contributions, rather to not step in the work that has already been
done by the assignee. If you want to work on a known issue with someone already
assigned to it, please contact the assignee first (e.g. by
mentioning the assignee in a new comment on the specific issue). This way you
can contribute with ideas, or even with code if the assignee decides that you
can step in.

If you plan to work on a non assigned issue, please add a comment on the issue
to prevent duplicated work.

### Sign your work

The sign-off is a simple line at the end of the explanation for the change. Your
signature certifies that you wrote the change or otherwise have the right to pass
it on as an open-source change. The rules are pretty simple: if you can certify
the below (from [developercertificate.org](http://developercertificate.org/)):

```
Developer Certificate of Origin
Version 1.1

Copyright (C) 2004, 2006 The Linux Foundation and its contributors.
660 York Street, Suite 102,
San Francisco, CA 94110 USA

Everyone is permitted to copy and distribute verbatim copies of this
license document, but changing it is not allowed.

Developer's Certificate of Origin 1.1

By making a contribution to this project, I certify that:

(a) The contribution was created in whole or in part by me and I
    have the right to submit it under the open source license
    indicated in the file; or

(b) The contribution is based upon previous work that, to the best
    of my knowledge, is covered under an appropriate open source
    license and I have the right under that license to submit that
    work with modifications, whether created in whole or in part
    by me, under the same open source license (unless I am
    permitted to submit under a different license), as indicated
    in the file; or

(c) The contribution was provided directly to me by some other
    person who certified (a), (b) or (c) and I have not modified
    it.

(d) I understand and agree that this project and the contribution
    are public and that a record of the contribution (including all
    personal information I submit with it, including my sign-off) is
    maintained indefinitely and may be redistributed consistent with
    this project or the open source license(s) involved.
```

Then you just add a line to each git commit message:

    Signed-off-by: Joe Smith <joe.smith@email.com>

Use your real name (sorry, no pseudonyms or anonymous contributions.)

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.
