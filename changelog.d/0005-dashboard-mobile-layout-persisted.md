[BugFixes]
- The console no longer loads in the mobile layout on a desktop window (or the
  desktop layout on a narrow one). `isMobile` and `isMobileNavOpen` are measured
  from the viewport, but they were being written to the stored user preferences
  and then restored over the live measurement when preferences loaded — leaving
  the side nav overlaying the page and the header controls hidden until the
  window was resized across the breakpoint. Viewport state is now owned by the
  breakpoint observer alone and is never persisted.
