// Production-build warnings that are known and accepted. The build fails on
// any warning not matched here (scripts/check-build-warnings.mjs), so a new
// warning cannot slip through a green gate. Each entry needs a reason: a
// matched warning still prints with it on every build, so it stays in view
// rather than being ignored.
//
// An entry allows exactly `count` matching warnings (default 1). One more
// fails as a new warning; fewer fails until the count is lowered or the
// entry removed, so fixing one never leaves room for another.
//
// { pattern: /regex for the warning's first line/, reason: 'why it cannot be fixed now', count: 3 }
export const ALLOWED_BUILD_WARNINGS = []
