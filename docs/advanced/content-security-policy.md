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
- `style-src` still permits `'unsafe-inline'`. Removing it is in progress.

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

Stratos also sends `X-Frame-Options: SAMEORIGIN`, which stops the console being
framed by another site, and `X-Content-Type-Options: nosniff`, which stops a
browser second-guessing the content type a response declares. Neither is
configurable.
