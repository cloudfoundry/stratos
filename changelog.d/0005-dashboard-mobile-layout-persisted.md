[BugFixes]
- Viewport state is no longer written to the stored user preferences.
  `isMobile` and `isMobileNavOpen` are measured from the window by the
  dashboard's breakpoint observer, but they were persisted alongside real
  preferences and then restored over that measurement when preferences loaded.
  They are now owned by the observer alone: never stored, and left untouched by
  hydration.
