[Chores]
- Removed `deploy/proxy.env`, an unused docker-compose file left over
  from 2017 whose sample database password tripped secret scanning.

[Security Updates]
- `vitest` and its browser packages moved from 4.1.10 to 4.1.12 in STB's
  test tooling. Nothing in the shipped console uses them:

| Advisory              | What it fixes                                        |
|-----------------------|------------------------------------------------------|
| [GHSA-82fw-gwwq-j7x9] | File read through the `@vitest/mocker` redirect mock |

[GHSA-82fw-gwwq-j7x9]: https://github.com/advisories/GHSA-82fw-gwwq-j7x9
