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

## The built-in policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
style-src-elem 'self' 'nonce-PLACEHOLDER' https://fonts.googleapis.com;
font-src 'self' data: https://fonts.gstatic.com;
img-src 'self' data:;
connect-src 'self';
worker-src 'self' blob:;
frame-ancestors 'self';
base-uri 'self';
form-action 'self'
```

A few of these are worth explaining:

- `connect-src 'self'` covers same-origin WebSockets, so the application log
  and stream sockets connect without needing a `ws:`/`wss:` wildcard. A bare
  wildcard would permit any host and security scanners flag it.
- `worker-src blob:` is required by the code editor, which starts its language
  workers from blob URLs.
- `frame-ancestors 'self'` mirrors the `X-Frame-Options: SAMEORIGIN` header
  Stratos already sends.
- The Google Fonts origins are permitted because the console can load its
  interface font from them.
- `'nonce-PLACEHOLDER'` is not sent literally. Each response replaces it with a
  freshly generated value that also appears on the styles in that response, so
  only those styles are permitted. A policy you supply yourself gets the same
  treatment: include the `'nonce-PLACEHOLDER'` token and it is substituted the
  same way.
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
