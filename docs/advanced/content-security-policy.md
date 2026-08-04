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
script-src 'nonce-PLACEHOLDER' 'strict-dynamic';
object-src 'none';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
style-src-elem 'self' 'nonce-PLACEHOLDER' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
worker-src 'self' blob:;
frame-ancestors 'self';
base-uri 'self';
form-action 'self';
report-uri /pp/v1/csp-report
```

A few of these are worth explaining:

- `connect-src 'self'` covers same-origin WebSockets, so the application log
  and stream sockets connect without needing a `ws:`/`wss:` wildcard. A bare
  wildcard would permit any host and security scanners flag it.
- `object-src 'none'` forbids plugin content — `<object>`, `<embed>` — which
  is a way of executing script that `script-src` does not cover. It is stated
  rather than left to `default-src`, because falling back to `'self'` would
  still permit plugin content served from the console's own origin. The console
  embeds none.
- `worker-src blob:` is required by the code editor, which starts its language
  workers from blob URLs.
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
  line_number=1 security_event=csp-violation
  source_file="https://stratos.example.com/main-7F3A9C2E.js"
  violated_directive=style-src-elem
```

Find them with `grep 'SECURITY:'`, or if you run Jetstream with
`LOG_TO_JSON=true`, filter on `.security_event == "csp-violation"`.

`violated_directive` names the rule, and `source_file` with `line_number` is
what identifies the resource — for an inline style or script, `blocked_uri` is
only ever the word `inline`.

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
