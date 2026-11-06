[Chores]
- Dependabot runs from one configuration file again. The repository had
  both `.github/dependabot.yml` and `.github/dependabot.yaml`, and only
  the first was in effect, so these were lost:
  - version updates for the backend Go modules
  - version updates for the website
  - the pinned `chore(deps)` commit prefix the release notes rely on
- The merged file restores them and adds a weekly grouped update across
  all seven Go modules.
