# Contributing to Stratos UI

Stratos UI is an open project and welcomes contributions. These guidelines are provided to help you understand how the project works and to make contributing smooth and fun for everybody involved.

There are two main forms of contribution: reporting issues and performing code changes.

## Reporting Issues

If you find a problem with Stratos UI, report it using [GitHub issues](https://github.com/suse/stratos/issues/new).

Before reporting a new issue, please take a moment to check whether it has already been reported
[here](https://github.com/suse/stratos/issues). If this is the case, please:

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
of new features. Before making any non-trivial change, get in touch with the Stratos UI developers first. This can prevent wasted effort later.

To send your code change, use GitHub pull requests. The workflow is as follows:

  1. Fork the project.

  1. Create a branch based on `master`.

  1. Implement your change, including tests and documentation.

  1. Run tests to make sure your change didn't break anything.

  1. Publish the branch and create a pull request.

  1. Stratos UI developers will review your change and possibly point out issues.
     Adapt the code under their guidance until all issues are resolved.

  1. Finally, the pull request will get merged or rejected.

See also [GitHub's guide on contributing](https://help.github.com/articles/fork-a-repo).

If you want to do multiple unrelated changes, use separate branches and pull
requests.

### Commits

Each commit in the pull request should do only one thing, which is clearly
described by its commit message. Especially avoid mixing formatting changes and
functional changes into one commit. When writing commit messages, adhere to
[widely used
conventions](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

When the commit fixes a bug, put a message in the body of the commit message
pointing to the number of the issue (e.g. "Fixes #123").

### Pull requests and branches

All work happens in branches. The master branch is only used as the target for pull
requests.

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
