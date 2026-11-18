[Chores]
- `make check coverage` now reports backend coverage as well: one Go
  profile per module in `coverage/backend/`, with per-module and total
  statement coverage. `make check frontend coverage` and
  `make check backend coverage` run one side.
- Frontend coverage now counts every source file in the tested packages,
  including files no test loads; before, those files were left out of the
  report and the totals read high. The report moved to `coverage/frontend/`.
