[Features]
- `scripts/secrets.sh` can read the openssl passphrase from the macOS
  Keychain instead of prompting for it. Store it once as service
  `stratos-e2e-secrets`, account `passphrase`, then pass
  `--keychain stratos-e2e-secrets` or set `STRATOS_SECRETS_KEYCHAIN`.
  Files stay compatible with ones encrypted at the prompt, and a
  missing item is an error rather than a fallback to the prompt.
