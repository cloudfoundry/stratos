[Features]
- Loading indicators are now one coherent system with visual variety. Four
  logical groups — inline busy ticks, area "Loading…" blocks, the page
  overlay, and indeterminate bars — each draw from a small pool of looks
  (arc, dual-ring, dashed, blinking dots, conic sweep, shimmer text,
  portal rings, and a rotating or breathing brand logo). A page picks its
  look deterministically, so different screens vary while any one screen
  stays stable. Pending list counts animate as blinking dots instead of a
  static ellipsis.

[Maintainability]
- The eight independent spinner implementations (three separate spin
  keyframe definitions, two gap positions, three speeds) collapsed into
  shared components driven by one keyframes file. All indicator colors
  now flow from currentColor and theme tokens, so light and dark mode
  need no per-indicator rules, and a single prefers-reduced-motion policy
  covers every indicator instead of just one.
