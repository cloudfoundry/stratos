[BugFixes]
- Colors set in `company-config.json` (`theme`, `navigation`, `layout`) stay
  in effect after the theme mode changes and after login; they used to be
  replaced by the built-in colors until the page was reloaded. The brand
  colors (`theme`) apply in dark mode too; the navigation and layout colors,
  which the file has no dark variants of, apply in light mode only.
