[BugFixes]
- Colors set in `company-config.json` (`theme`, `navigation`, `layout`) stay
  in effect after the theme mode changes and after login; they used to be
  replaced by the built-in colors until the page was reloaded. The brand
  colors (`theme`) apply in dark mode too; the navigation and layout colors,
  which the file has no dark variants of, apply in light mode only.
- The browser console no longer logs the whole theme on every theme change
  and mode switch. Set `debug.logThemeChanges` in `company-config.json` to
  turn those logs on.
- The browser console says once, at startup, which company config was
  applied: `company-config.json`, the environment file, or the built-in
  defaults.
