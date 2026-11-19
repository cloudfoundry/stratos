[BugFixes]
- The YAML editor for Helm chart values (install a chart, upgrade a
  release) checks the values against the chart's schema again, and
  offers completion, hover help and folding. Since the move to Monaco
  0.56 its YAML support had not started.
