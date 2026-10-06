---
title: Content Security Policy
sidebar_label: Content Security Policy
---

Stratos sends a `Content-Security-Policy` header with the console page. The
header tells the browser which origins the page is allowed to load scripts,
styles, fonts, images and connections from, and to refuse everything else. It
limits what an injected script can reach if content ever does get injected into
the page.

The built-in policy is applied by default. It permits only the origins the
console itself needs, so a deployment that reaches somewhere else has to say so
— see [Overriding the policy](#overriding-the-policy) below.

## Settings

The `CONSOLE_CSP` environment variable controls the header.

| Value | Effect |
|-------|--------|
| unset, `default`, or `on` | The built-in policy below. This is the default. |
| `off`, `none`, `false`, `disabled` | No `Content-Security-Policy` header is sent. |
| anything else | Used verbatim as the policy. |

Values are matched without regard to case.

`CONSOLE_CSP_GIT_HOSTS` adds Git hosts to the built-in policy, so the deploy
wizard can reach them without replacing the whole policy. See
[Deploying from GitHub and GitLab](#deploying-from-github-and-gitlab) below.

Two further variables control violation reporting, described under
[Violation reporting](#violation-reporting) below.

| Variable | Effect |
|----------|--------|
| `CONSOLE_CSP_REPORT_COLLECTOR` | A URL to forward a copy of each report to, in addition to the log. Unset means the log only. |
| `CONSOLE_CSP_REPORT_ONLY` | A stricter policy to trial without enforcing it. Unset means no such header. |

One directive is added to whatever policy is in effect, including one you
supply yourself: `report-uri /pp/v1/csp-report`, which is how violations reach
the log at all. It permits and forbids nothing. If your own policy already
names a `report-uri` or `report-to`, yours is left alone and nothing is
appended — declaring either twice would lose the destination you chose.

## The built-in policy

```
default-src 'self';
script-src 'nonce-PLACEHOLDER' 'strict-dynamic' 'report-sample';
object-src 'none';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
style-src-elem 'self' 'nonce-PLACEHOLDER' 'report-sample' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data: https://avatars.githubusercontent.com https://gitlab.com https://secure.gravatar.com;
connect-src 'self';
worker-src 'self';
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
require-trusted-types-for 'script';
report-uri /pp/v1/csp-report
```

A few of these are worth explaining:

- `connect-src 'self'` covers same-origin WebSockets, so the application log
  and stream sockets connect without needing a `ws:`/`wss:` wildcard. A bare
  wildcard would permit any host and security scanners flag it.
- `connect-src` names no Git host. The deploy wizard's GitHub and GitLab
  sources reach a Git host either through the console's backend, which `'self'`
  already covers, or from the browser, which only works for hosts you list in
  `CONSOLE_CSP_GIT_HOSTS`. See
  [Deploying from GitHub and GitLab](#deploying-from-github-and-gitlab).
- `img-src` names the hosts that GitHub, GitLab.com and Gravatar serve avatars
  from, so the owner and commit author pictures in the deploy wizard and an
  application's Git tab show. Images can't run script, so allowing them costs
  little. A GitHub Enterprise or self-hosted GitLab host's avatars show once
  that host is in `CONSOLE_CSP_GIT_HOSTS`; until then the picture is left out.
- `object-src 'none'` forbids plugin content — `<object>`, `<embed>` — which
  is a way of executing script that `script-src` does not cover. It is stated
  rather than left to `default-src`, because falling back to `'self'` would
  still permit plugin content served from the console's own origin. The console
  embeds none.
- `worker-src 'self'` covers the code editor's language workers, which are
  ordinary same-origin scripts served by the console like any other. Earlier
  releases also permitted `blob:` here, and no longer do: a worker started from
  a blob URL runs under the page's own policy, which would give script a way in
  that the nonce above never authorised.
- `frame-ancestors 'self'` mirrors the `X-Frame-Options: SAMEORIGIN` header
  Stratos already sends.
- The Google Fonts origins are permitted because the console can load its
  interface font from them.
- `'nonce-PLACEHOLDER'` is not sent literally. Each response replaces it with a
  freshly generated value that also appears on the scripts and styles in that
  response, so only those are permitted. A policy you supply yourself gets the
  same treatment: include the `'nonce-PLACEHOLDER'` token and it is substituted
  the same way.
- `script-src` names no origin at all, not even `'self'`. `'strict-dynamic'`
  makes the browser ignore every origin in that directive and go by the nonce
  instead: the console's own scripts carry it, and anything they go on to load —
  the parts of the interface that arrive only when you navigate to them, and the
  code editor — is trusted because a trusted script asked for it. A script
  injected into the page is refused even when it is served from the console's
  own address, which is what an origin-based rule cannot do. Adding `'self'`
  back would not restore anything, because the browser ignores it; if you need
  a script from somewhere else, the mechanism is a nonce, not an origin.
- `require-trusted-types-for 'script'` covers what the rules above cannot see.
  They all govern how script and styles *arrive*; none of them says anything
  about a string that script already running assigns to `innerHTML`, which is
  where DOM-based XSS lives. With this set, the browser refuses a plain string
  at those points outright. No `trusted-types` allowlist accompanies it, so any
  policy name is permitted: naming them would tie the console's policy to the
  internals of Angular and the code editor, and break it on the upgrade that
  adds one.
- `'report-sample'` permits nothing. It asks the browser to include the opening
  characters of whatever it refused in the violation report, which is the only
  thing that distinguishes one blocked inline script or style from another. It
  is on the two directives that can refuse inline content, and not on
  `style-src`, which still permits it and so has nothing to report.
- `style-src-elem` governs `<style>` elements and stylesheet links, and it
  replaces `style-src` for them rather than adding to it. If you extend
  `style-src` with an origin, add it to `style-src-elem` too or stylesheets
  from that origin are still refused.
- `style-src` continues to permit `'unsafe-inline'`, but with `style-src-elem`
  declared, what that now covers is inline style *attributes* — the code editor
  positions each line with one, and the terminal colours each cell with one.
  CSP offers no nonce or hash for attributes whose values are computed at
  runtime, so this cannot be tightened by configuration; it needs the libraries
  to set those styles through the CSSOM instead, which CSP exempts.

## Deploying from GitHub and GitLab

The deploy wizard's GitHub and GitLab sources list repositories, branches and
commits from the Git host. Depending on the tab you use, that request goes
through the console's backend or straight from your browser to the Git host.
Only requests from the browser are subject to this policy.

| Wizard source | Request goes | What it needs |
|---------------|--------------|---------------|
| GitHub or GitLab, **Public** tab, with a registered endpoint | Through the backend | Nothing in this policy. The console's server must be able to reach the host. |
| GitHub or GitLab, **Public** tab, no endpoint registered | From the browser to `api.github.com` or `gitlab.com` | That host in `CONSOLE_CSP_GIT_HOSTS`. |
| GitHub or GitLab, **Private** tab (token typed into the wizard) | From the browser to `api.github.com` or `gitlab.com` | That host in `CONSOLE_CSP_GIT_HOSTS`. |
| **GitHub Enterprise** or **Self-hosted GitLab** tab | From the browser to the URL you enter | That host in `CONSOLE_CSP_GIT_HOSTS`. |
| **Public Git URL** | The backend clones the repository | Nothing in this policy. |

A token typed into the Private or Enterprise tab goes from the browser to the
Git host and never reaches the console's server. A registered endpoint instead
stores each user's token in the console and sends their requests through the
backend. An administrator decides which hosts are registered, and the browser
needs no access to them.

### Allowing Git hosts

Set `CONSOLE_CSP_GIT_HOSTS` to a comma-separated list of `https://` origins.
Each one is added to `connect-src`, so the browser may call it, and to
`img-src`, so its avatars show:

```
CONSOLE_CSP_GIT_HOSTS=https://api.github.com,https://gitlab.com
```

| Wizard Git source  | Add                           |
|--------------------|-------------------------------|
| GitHub.com         | `https://api.github.com`      |
| GitLab.com         | `https://gitlab.com`          |
| GitHub Enterprise  | `https://<your GHE host>`     |
| Self-hosted GitLab | `https://<your GitLab host>`  |

- It is empty by default, so the built-in policy is exactly as shown above.
- Each entry must be an origin: `https://`, a host, and optionally a port. No
  path, quotes, spaces or semicolons. Jetstream will not start with an entry
  that isn't one, and names the entry in its error, rather than writing it
  into the header.
- It applies to the built-in policy only. If `CONSOLE_CSP` holds a policy of
  your own, or turns the policy off, the setting is ignored and Jetstream logs
  a warning at startup, because your policy is used verbatim. Add the hosts to
  your policy instead.
- Every host you add is one an injected script could also send data to. List
  only the hosts your users deploy from.

### Moving from a custom CONSOLE_CSP

Before this setting existed, the only way to allow a Git host was to replace
the whole policy with `CONSOLE_CSP`. A copy made that way keeps whatever the
built-in policy was when it was made and misses everything added since, such
as the script nonce, `'strict-dynamic'` and Trusted Types.

If your `CONSOLE_CSP` differs from the built-in policy only by its Git hosts,
remove it and list the hosts in `CONSOLE_CSP_GIT_HOSTS`. You then run the
built-in policy, and you get its future updates when you upgrade.

### When it doesn't work

| What you see | Why | Fix |
|--------------|-----|-----|
| Any GitHub or GitLab tab: "Could not reach `<host>`" | The browser refused the request, usually because the host isn't in `CONSOLE_CSP_GIT_HOSTS` | Add the host, or register it as a Git endpoint |
| Jetstream log: `violated_directive=connect-src` and `blocked_uri` naming a Git host | The same refusal, as the server sees it (see [Violation reporting](#violation-reporting)) | As above |
| Git avatars missing for a GitHub Enterprise or self-hosted GitLab host | Its host isn't in `img-src` | Add the host to `CONSOLE_CSP_GIT_HOSTS` |
| "Git request failed" followed by a status such as `(401)` or `(404)` | The Git host answered and refused, so the policy is not involved | Check the token and its scopes, and the repository name |

### For contributors

`getAPI()` in `src/frontend/packages/git/src/shared/scm/scm-base.ts` chooses
the route: a registered endpoint goes to `/api/v1/proxy/<endpoint guid>`, and
otherwise the request goes from the browser to the public or Enterprise API
URL. Jetstream builds the policy once at startup (`loadPortalConfig` in
`src/jetstream/main.go`): `builtInCSPPolicy` in `src/jetstream/csp.go` adds the
origins from `CONSOLE_CSP_GIT_HOSTS` to the built-in policy. The message for a
host the browser could not reach comes from `unreachableHostMessage` in
`src/frontend/packages/git/src/shared/scm/scm-base.ts`.

## Violation reporting

When the browser refuses to load something the policy does not permit, it posts
a report to Stratos, which writes it to the Jetstream log as a security
warning. This is on whenever the policy is, and needs no configuration.

It matters because a blocked resource is usually **silent**. The page keeps
rendering, the elements still look right in the inspector, and the only signs
are a console message nobody is watching and something subtly wrong on screen.
Without reporting, the first you hear of it is a user saying a page looks odd.

A logged violation looks like this:

```
WARN[Mon Aug  3 13:18:01 PDT 2026] SECURITY: Content-Security-Policy violation reported by browser
  blocked_uri=inline disposition=enforce
  document_uri="https://stratos.example.com/applications/9f2c/log-stream"
  line_number=1 script_sample=".xterm-fg-124 { color: #af"
  security_event=csp-violation
  source_file="https://stratos.example.com/main-7F3A9C2E.js"
  violated_directive=style-src-elem
```

Find them with `grep 'SECURITY:'`, or if you run Jetstream with
`LOG_TO_JSON=true`, filter on `.security_event == "csp-violation"`.

`violated_directive` names the rule, and `source_file` with `line_number` is
what identifies the resource — for an inline style or script, `blocked_uri` is
only ever the word `inline`. `script_sample` is what tells those apart: the
first characters of the content that was refused, which is usually enough to
recognise where it came from. It is the refused content itself rather than a
description of it, so on a genuine injection attempt it is the injected text
that appears here, bounded in length and escaped.

Two things are deliberately absent. The report's `original-policy` field is not
logged: it is the whole policy, identical on every violation, and it contains
that response's nonce. Nor is any user identified — a violation is a fact about
a page, and putting names in a security log is a liability of its own.

Reports are logged at a bounded rate. The endpoint has to accept requests
without authentication, because the login page carries the policy too and a
violation there must still be reportable, so the rate is capped to stop it
being used to fill your log storage. If the cap is reached, the count of
reports not written is logged when the minute ends, rather than dropping them
silently.

### Sending reports somewhere else as well

Set `CONSOLE_CSP_REPORT_COLLECTOR` to a URL and Stratos will also forward each
report there. This is in addition to the log, never instead of it.

The forwarded copy is richer than the log line, because a collector is a
security feed rather than something you read by eye. It carries the complete
browser report plus the Stratos version and commit, the time of receipt,
whether the policy was the built-in one or your own, the client address and
`X-Forwarded-For`, the user agent, and whether the page was authenticated — as
a yes or no, not as an identity.

The response nonce is replaced with `'nonce-REDACTED'` before the report is
sent. Everything else in the policy is left intact.

Forwarding is best-effort: one attempt with a short timeout, no retry and no
queue. A collector that is down costs you forwarded reports, never a delay to
the console, and the failure is logged. The log remains the record.

Because reports come to Stratos first and are forwarded from there, the
collector URL is never sent to the browser.

### Trialling a stricter policy

`CONSOLE_CSP_REPORT_ONLY` takes a full policy string and sends it as
`Content-Security-Policy-Report-Only` alongside the enforced one. It blocks
nothing. Violations of it arrive through the same reporting as above, marked
`disposition=report` instead of `enforce`, so you can see what a tightening
*would* have broken before you enforce it.

There is no built-in value: only you know what you want to trial.

Both headers describe the same response, so a candidate policy may use
`'nonce-PLACEHOLDER'` and it is substituted with the same nonce the enforced
policy used.

One thing to expect: a report-only policy makes the browser log a
"would have been blocked" message in the user's console for everything the
candidate would refuse. Nothing breaks, but users with developer tools open
will see it, so trial a candidate on a staging foundation before a busy one.

## Overriding the policy

Everything the console talks to normally goes through Jetstream on the same
origin, including the Cloud Foundry API and metrics traffic, so the built-in
policy covers a stock deployment.

Set `CONSOLE_CSP` to your own policy string if your deployment reaches an origin
the built-in policy does not name. A custom metrics endpoint or an authentication
service on another host are the usual reasons. Start from the policy above and
add the origin to the directive that needs it, rather than writing one from
scratch, or you will find features failing one at a time.

For Git hosts, use `CONSOLE_CSP_GIT_HOSTS` instead; it keeps the built-in
policy. See [Deploying from GitHub and GitLab](#deploying-from-github-and-gitlab).

If the console misbehaves after an upgrade and you need it working before you
have time to investigate, `CONSOLE_CSP=off` sends no header at all. Look in the
browser's developer console for messages naming a blocked resource and the
directive that blocked it — that names the directive to extend.

## Caching of the console page

Each response carrying the console page includes a nonce that authorises the
inline styles in that specific response. Because the nonce differs every time,
the page is served with `Cache-Control: no-store` and is never cached. Static
assets are unaffected and cache normally.

If you put a proxy or CDN in front of Stratos, it must not cache the console
page. A cached page would pair a stale nonce with a fresh header and the
browser would block the page's styles.

## Other security headers

Every response also carries the following. Unlike the policy above they are the
same on every response, so none of them involves a nonce.

| Header | Value | Purpose |
|--------|-------|---------|
| `X-Frame-Options` | `SAMEORIGIN` | Stops the console being framed by another site. |
| `X-Content-Type-Options` | `nosniff` | Stops a browser second-guessing the content type a response declares. |
| `Cross-Origin-Opener-Policy` | `same-origin` | Puts the console in its own browsing-context group, so a cross-origin document cannot reach into it through `window.opener`. |
| `Cross-Origin-Resource-Policy` | `same-origin` | Stops another origin embedding Stratos responses as subresources. |
| `Permissions-Policy` | see below | Switches off browser features the console does not use. |

None of these is configurable. The `Permissions-Policy` denies access to the
camera, microphone, geolocation, payment, USB, MIDI, screen capture and the
motion sensors, among others.

Reading and writing the clipboard are both deliberately still permitted for the
console's own origin. The console copies to the clipboard in a good many
places — endpoint addresses, service-key and other credentials, the diagnostics
reports, the foundation report export — and the code editor reads the clipboard
when you paste into it. Denying either fails silently: the copy button appears
to work and nothing is copied.

These two entries cover only the asynchronous Clipboard API. Ordinary cut,
copy and paste in a text box, in the terminal, and in much of the code editor
use older browser mechanisms that no permissions policy governs, and they keep
working whatever this header says. So if you are checking whether a change here
broke anything, pasting into a text field will not tell you — use one of the
copy buttons.

### HTTP Strict Transport Security

`Strict-Transport-Security` is **off unless you ask for it**, because it is a
promise about your domain rather than about Stratos: once a browser has seen
the header, that whole domain is HTTPS-only for the lifetime of the `max-age`,
whether or not Stratos is still serving it. Only you know whether that is safe
to say.

The `CONSOLE_HSTS` environment variable controls it, using the same vocabulary
as `CONSOLE_CSP`.

| Value | Effect |
|-------|--------|
| unset, `off`, `none`, `false`, `disabled` | No header is sent. This is the default. |
| `on` or `default` | `max-age=63072000; includeSubDomains` |
| anything else | Used verbatim as the header value. |

Values are matched without regard to case.

The built-in value is two years including subdomains, which is what the HSTS
preload list requires, but it deliberately stops short of adding `preload`.
Preloading is close to irreversible and is a decision about your domain, so add
that token yourself if you want it.

The header is sent whenever you enable it, without checking whether the
connection Jetstream itself received was TLS. In most deployments TLS
terminates at a router in front of Jetstream, which then forwards the header to
the browser over HTTPS; testing the local connection would suppress it in
exactly that case. Browsers ignore HSTS received over plain HTTP, so sending it
there is harmless.

### Cross-Origin-Embedder-Policy is not implemented

`Cross-Origin-Embedder-Policy` is intentionally absent. Setting it to
`require-corp` makes the browser refuse every cross-origin subresource that
does not explicitly opt in, which would block the Google Fonts stylesheet and
font files the policy above permits. It also gains little on its own: its main
purpose is to enable cross-origin isolation for features such as
`SharedArrayBuffer`, which the console does not use.
