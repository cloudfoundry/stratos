[BugFixes]
- Screen readers no longer read icon names ("mode_edit", "cloud_done")
  aloud. Icons that only decorate are hidden from them, and icons that
  are the only sign of something, such as a status, a warning or a
  report grade, are announced by what they mean.
- Every button and link that shows only an icon has a spoken name. The
  error banner's dismiss icon is now a button that keyboard users can
  reach.
- Text on success, warning and danger buttons meets the contrast
  minimum, including with a company's own status colors.
- Error and warning messages (the endpoint error banner, list load
  errors, dialogs, the deploy stages) meet the contrast minimum in light
  and dark mode.
