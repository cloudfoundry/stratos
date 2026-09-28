[Chores]
- Dependabot runs from one configuration file again. The repository had
  both `.github/dependabot.yml` and `.github/dependabot.yaml`; only the
  first was in effect, so the backend Go modules and the website got no
  version updates, and the `chore(deps)` commit prefix the release
  notes rely on was not pinned. The merged file restores both and adds
  a weekly grouped update across all seven Go modules.
