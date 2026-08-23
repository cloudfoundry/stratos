[Breaking Changes]
- API key secrets are now stored hashed instead of in plaintext
  (HMAC-SHA256 peppered with the console encryption key). Existing keys
  are hashed in place on upgrade, so keys already issued keep working.
  Because the hash is keyed with `ENCRYPTION_KEY`, changing that key now
  invalidates stored API keys — in addition to the stored endpoint tokens
  it already invalidates.

[BugFixes]
- WebSocket upgrades (application SSH and log streaming) now validate the
  request Origin — same-origin, plus any host in `ALLOWED_ORIGINS` —
  instead of accepting connections from any origin, closing a cross-site
  WebSocket hijacking vector.
- The session cookie is now issued with `SameSite=Lax`.
- Jetstream no longer terminates when the Cloud Foundry info request fails
  during SSO auto-connect at login. That one login fails instead of the
  whole process exiting for every user.
- Proxied requests that time out no longer leak a goroutine and its
  buffered response body per endpoint.
- The OAuth client secret and the application-SSH one-time code are no
  longer written to the jetstream log.
- Jetstream now warns at startup when `ENCRYPTION_KEY` is left at the
  well-known default value shipped in `config.example`.
