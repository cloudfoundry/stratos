[Accessibility: 1.4.3 Contrast (Minimum)]
- Status text meets 4.5:1 in both modes. Text drawn in a status shade
  now uses the status text colours: the foundation shape diff marks
  and errors, the service key Delete and route service Unbind
  buttons, "Failed to load credentials", form warnings and errors
  ("Not valid JSON", variable name checks, "Namespace does not
  exist", "Shared (n apps)" when deleting routes, "<redacted>" in the
  credential preview), the Kubernetes "Failed to load" messages and
  update pills, "Expired", "Nothing selected - showing all", "Copied
  to clipboard", the detail page status pill, and metric card counts
  near their limit. They measured 2.2 to 4.2:1 in light mode, and the
  red shades 2.9 to 3.5:1 in dark mode.
- The text in the restore endpoints and UAA SSO alerts takes the
  alert's colour, 6.6 to 8.1:1. The orange text measured 3.0:1 and
  the version numbers in their small boxes 2.4:1.
- The GitHub commit author link meets 4.5:1 in both modes (it
  measured 3.7:1), and the page header breadcrumbs keep their colour
  on hover (the hover shade measured 3.5:1).

[Accessibility: 1.4.11 Non-text Contrast]
- Status icons that stand alone and carry a name meet 3:1 in light
  mode: event type icons, the favourite "may have been deleted" mark,
  the slow endpoint and duplicate URL marks, the expired endpoint
  icon, a yes/no icon shown alone, and the Kubernetes "multiple
  versions" mark. They measured 2.2 to 2.8:1.
