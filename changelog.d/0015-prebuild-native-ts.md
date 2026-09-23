[Chores]
- The build no longer downloads `tsx` from the npm registry every time it
  runs. The pre-build step ran the backend plugin generator through
  `npx tsx`, and because `tsx` is not a dependency, npx fetched whatever
  version was newest on each build. Node now runs the generator directly,
  and the generated `extra_plugins.go` is unchanged.
