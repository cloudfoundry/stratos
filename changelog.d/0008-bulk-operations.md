[Features]
- Bulk operations returned across CF. Lists and cards support selection (#5382, #5665), routes can be deleted or unmapped in bulk and roles managed for several users at once (#5444), and the full set of CF bulk operations is restored with guard tests behind it (#5664). A bulk delete now reports the real settled outcome of each item with live progress rather than an optimistic summary (#5680).
- All CF entity deletes route through one chokepoint (#5406), which made a blocked-delete state with classified reasons possible (#5407).
