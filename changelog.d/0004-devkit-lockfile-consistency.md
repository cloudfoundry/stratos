[Chores]
- The devkit install no longer rewrites its own lockfile. `ensure-devkit`
  ran `npm install --legacy-peer-deps` against a `package-lock.json`
  generated without that flag, so every root install — CI included —
  silently dropped the ten peer entries the lockfile records. It now runs
  `npm ci`, which installs exactly what the lockfile says and never writes
  to it.
