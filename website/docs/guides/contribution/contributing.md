---
id: contributing
title: Contributing to Stratos UI
sidebar_label: Contributing to Stratos UI 
---

## Reporting issues

Before reporting an issue, please check whether it has already been reported
[here](https://github.com/cloudfoundry/stratos/issues). If this is the case, please:

- Read all the comments to confirm that it's the same issue you're having.
- Refrain from adding "same thing here" or "+1" comments. Just hit the
  "subscribe" button to get notifications for this issue.
- Add a comment only if you can provide helpful information that has not been
  provided in the discussion yet.

If you want to report a **new issue**, please ensure you give as much detail
as possible about your setup/environment and provide sufficient steps
for the issue to be easily reproduced.

## Check for assigned people

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

## Sign your work

The sign-off is a simple line at the end of the explanation for the patch. Your
signature certifies that you wrote the patch or otherwise have the right to pass
it on as an open-source patch. The rules are pretty simple: if you can certify
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

Then you just add a line to every git commit message:

    Signed-off-by: Joe Smith <joe.smith@email.com>

Use your real name (sorry, no pseudonyms or anonymous contributions.)

If you set your `user.name` and `user.email` git configs, you can sign your
commit automatically with `git commit -s`.
