[Chores]
- Pull requests that change only `docs/` now build the documentation
  website, as the deploy does, and the docs lint rejects relative links
  that leave `docs/`. A link to `../CONTRIBUTING.md` had passed both and
  stopped the site from publishing; it now uses its GitHub URL.
