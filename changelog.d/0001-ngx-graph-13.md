[Chores]
- Dependency bumps: `@swimlane/ngx-graph` 11 to 13, `copy-webpack-plugin` 13
  to 14, `json-schema-to-typescript` 15 to 16, `eslint` 10.8 to 10.9, `mktemp`
  2.0.3 to 2.0.4, `google.golang.org/grpc` 1.82 to 1.83 in jetstream, and the
  indirect `fast-uri` 3.1.5 to 3.1.7 in the devkit lockfile.
  ngx-graph 12 rewrote its graph component on signal inputs and renamed
  `draggingEnabled` to `enableDrag`, which the Helm release resource graph
  binds; the module wrapper it used to import is deprecated, so it now
  imports the standalone component instead.
