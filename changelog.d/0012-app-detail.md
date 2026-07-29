[Features]
- The application detail page merged Instances into Summary, reworked the scaling controls and added live instance telemetry (#5427).

[BugFixes]
- Switching application tabs no longer remounts the page and refetches environment variables every time (#5519, #5526), and starting an unstaged application reports the real CF error instead of a generic failure (#5520, #5525).
