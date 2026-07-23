# changelog.d — release-notes fragments

Each PR carries its own release-notes fragment here. When a release is
cut, the fragments are assembled into the annotated release tag body
(`make stamp tag`), published as the GitHub release notes
(`make publish`), and then removed (`make sweep`) — this directory is
empty right after every release. Only this README is permanent.

## Adding a fragment to your PR

```bash
./build/release-notes.sh new          # names it after your branch
./build/release-notes.sh new my-slug  # or pick a slug
```

This creates `NNNN-<slug>.md` (NNNN = highest existing + 1). If a
concurrent PR picks the same NNNN that's fine — the slug keeps the
filenames distinct and ties just sort alphabetically.

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
| `[Chores]` | Dependency bumps, refactors, CI/build changes |
| `[Security Updates]` | CVE fixes (table of release/version/CVE links) |

A section appears in the published notes only when at least one fragment
contributes to it. Unknown section headers fail assembly loudly.

Preview the assembled notes any time:

```bash
./build/release-notes.sh assemble
```
