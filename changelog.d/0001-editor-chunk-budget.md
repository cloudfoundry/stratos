[Chores]
- The production build now fails on any warning that is not listed, with
  a reason, in `scripts/build-warnings-allowed.mjs`. Listed warnings still
  print on every build. This is what let the Monaco 0.57 bump push the
  editor chunk past its size budget unnoticed; that budget is now 2.85 MB.
