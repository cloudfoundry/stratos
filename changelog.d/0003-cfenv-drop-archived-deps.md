[Chores]
- go-cfenv updated to v1.19.0, removing the archived `mitchellh/mapstructure` and `joefitzgerald/rainbow-reporter` from Jetstream's dependency graph. go-cfenv was the only path to archived mapstructure in the build, and its old `go 1.11` directive was also leaking test-only dependencies into Jetstream's module graph.
