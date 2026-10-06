[Features]
- New setting `CONSOLE_CSP_GIT_HOSTS` lets the deploy wizard reach your
  Git hosts without replacing the whole Content-Security-Policy.
- Why it's needed: unless a registered endpoint is selected, the wizard's
  GitHub and GitLab sources call the Git host from the user's browser. The built-in policy only allows the console's own
  address, so those calls fail until the host is allowed. Until now the
  only way to allow one was to replace the whole policy with
  `CONSOLE_CSP`. That copy then misses every later hardening of the
  built-in policy.
- Set it to a comma-separated list of `https://` addresses. Each one is
  added to the built-in policy. For example:
  `CONSOLE_CSP_GIT_HOSTS=https://api.github.com,https://gitlab.com`

| Wizard Git source                 | Add to CONSOLE_CSP_GIT_HOSTS       |
|-----------------------------------|------------------------------------|
| GitHub.com                        | `https://api.github.com`           |
| GitLab.com                        | `https://gitlab.com`               |
| GitHub Enterprise                 | `https://<your GHE host>`          |
| Self-hosted GitLab                | `https://<your GitLab host>`       |
| Registered GitHub/GitLab endpoint | nothing (goes through the backend) |
| Public Git URL                    | nothing (the backend clones it)    |

- Nothing to do on upgrade: the setting is empty by default and the
  built-in policy is unchanged.
- If you set `CONSOLE_CSP` only to allow Git hosts, you can remove it
  and list the hosts here instead. You get the built-in policy back,
  including its future updates. A custom `CONSOLE_CSP` still wins: this
  setting is then ignored and a warning is logged at startup.
- How each wizard source reaches its Git host, what to do when one
  fails, and the rules for entries: [Deploying from GitHub and GitLab].

[Deploying from GitHub and GitLab]: https://stratos.app/docs/advanced/content-security-policy#deploying-from-github-and-gitlab

[BugFixes]
- The deploy wizard's Public tab can deploy from GitHub or GitLab without
  a registered endpoint. Before, Next silently did nothing even after a
  repository and branch were chosen.
- When the browser can't reach a Git host, the wizard names the host and
  says how to allow it (`CONSOLE_CSP_GIT_HOSTS`, or registering it as an
  endpoint). Before, the repository search showed no suggestions and no
  reason, or said only "Git request failed".
- Owner and commit avatars from GitHub, GitLab.com and Gravatar now show
  in the wizard and the application's Git tab. GitHub Enterprise and
  self-hosted GitLab avatars show once that host is in
  `CONSOLE_CSP_GIT_HOSTS`.
