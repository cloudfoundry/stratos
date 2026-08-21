[Features]
- The application Variables tab now masks secret-looking values —
  keys matching pass/secret/token/private/key/cred, URLs with
  embedded credentials, and PEM private-key blocks under any
  variable name — in both the variables list and the All
  Variables block. Values appear only on explicit request: a per-row
  Show/Hide toggle in the list, a Show secrets toggle on the block.
  The same value heuristics the Service Keys page already uses; hosts and
  ports in connection URLs stay readable.
