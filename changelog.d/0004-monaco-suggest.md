[BugFixes]
- Completions and go-to-definition returned to the editor: monaco
  0.56's per-feature registry omits the suggest controller and the
  go-to commands (upstream's full build imports them directly), so the
  curated subset lost Ctrl+Space and F12. Found by live-driving the
  deployed editor; the contribs are now imported directly.
