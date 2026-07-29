[Features]
- Sorting uses a tokenized natural comparison with a match-case toggle, so `cf1` sorts before `cf2` before `cf10` (#5368).

[BugFixes]
- The "All" page size works again in signal-list (#5576), and every app-table consumer now runs on signal-list rather than the retired legacy list framework (#5402, #5405).
