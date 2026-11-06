# changelog.d — release-notes fragments

Each PR carries its own release-notes fragment here. When a release is
cut, the fragments are assembled into the annotated release tag body
(`make stamp tag`) and published as the GitHub release notes
(`make publish`).

Fragments are **not** cleared after a prerelease. They accumulate until
the official release, so each prerelease republishes everything the
directory holds — including entries an earlier prerelease already
announced. That repetition is deliberate: a prerelease's notes are meant
to stand on their own, and nobody reading them should have to chain
several intermediate releases together to work out what changed.
`make sweep` empties the directory, and it runs only when the official
release ships. Only this README is permanent.

## Adding a fragment to your PR

```bash
./build/release-notes.sh new          # names it after your branch
./build/release-notes.sh new my-slug  # or pick a slug
```

This creates `NNNN-<slug>.md` (NNNN = highest existing + 1). The number
is only there to keep filenames distinct — it does **not** decide where
your entry appears in the published notes, so if a concurrent PR picks
the same NNNN that's fine and needs no coordination.

Bullets are ordered by when each fragment **landed on develop**, taken
from the commit that added the file. Nothing a contributor can write at
authoring time could express that: you don't know the merge order while
you're still working, two people branching from the same develop pick the
same number, and even a PR number would only record the order PRs were
*opened* — nothing requires them to merge in that order.

Write your entry under the section header(s) it belongs to. One file can
feed multiple sections:

```markdown
[Features]
- Added the frobnicator panel to the application summary page.

[BugFixes]
- Fixed the frobnicator crashing on empty input.
```

Valid sections, in the order they appear in the published notes:

| Section | Use for |
|---------|---------|
| `[Breaking Changes]` | Anything an operator must act on before upgrading |
| `[Features]` | New functionality |
| `[BugFixes]` | Fixes |
| `[Maintainability]` | Keeping the codebase current: retiring an unmaintained or archived dependency, consolidating forked or vendored code, clearing scanner findings |
| `[Chores]` | Routine dependency bumps, CI/build changes, docs |
| `[Security Updates]` | CVE fixes (table of release/version/CVE links) |

A section appears in the published notes only when at least one fragment
contributes to it. Unknown section headers fail assembly loudly.

### Lists read as columns, not sentences

When an entry covers several items, lay them out instead of chaining them
into one sentence:

- **Version moves** → a table with `From` and `To` columns.
- **Named items with a meaning** (advisories, removed pins, renamed
  files) → a two-column table, such as `Advisory | What it fixes`.
- **A short list of plain items** → a nested list under the bullet.

Keep the explanation as bullets around the table. Pad the columns so they
line up: the notes are also read as plain text in the release tag. Long
links go in reference form (`[GHSA-xxxx]` in the cell, the URL below the
table) so the table stays narrow.

```markdown
[Chores]
- Backend dependency updates:

| Component  | From   | To     |
|------------|--------|--------|
| Helm       | 3.21.4 | 3.22.0 |
| go-sqlite3 | 0.35.4 | 0.35.6 |

- capi now comes from its upstream release instead of a fork.
```

Preview the assembled notes any time:

```bash
./build/release-notes.sh assemble
```

## Dependency updates

Dependabot opens PRs but never runs this tooling, so its bumps are read out
of the commit log instead of being authored per PR — they are identified by
the `chore(deps)` commit prefix pinned in `.github/dependabot.yml`.

```bash
./build/release-notes.sh check   # how many bumps since the last release tag
./build/release-notes.sh deps    # draft NNNN-dependency-updates.md from them
```

`check` is safe to run at any time and answers "has enough piled up to be
worth a build yet?". It also runs automatically during `make stamp tag`,
before the notes are frozen into the tag body, and warns there if bumps
landed that no fragment mentions. A fragment counts as covering every bump
older than it, so `check` also notes each bumped package that no fragment
names (`NOTE: not named in any fragment: eslint`) — confirm the prose
covers it, or add a row. It only ever warns — it never blocks.

`deps` writes a draft: a `Package | From | To` table of the bumps, with
any subject that has no from/to (a group bump, dependency work done by
hand) listed under it. Review it before the release — merge rows, add
context, move a security bump to `[Security Updates]`; the fragment is
what ships. Both commands take an optional starting
ref (`./build/release-notes.sh deps v5.0.0-dev.147`) when the window should
not be the last tag.

Because both read the commit log, they only see bumps that have **landed on
this branch** — a bump still sitting in an open PR is not counted.

A pull request that adds no fragment at all gets a non-blocking warning on
the Files tab. Dependabot's own PRs are exempt from it, since they are
covered by the two commands above.
