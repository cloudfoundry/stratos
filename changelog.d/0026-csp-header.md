[Features]
- Jetstream can send a Content-Security-Policy header, opt-in through `CONSOLE_CSP` (#5688). It is off by default; operators who enable it should read the CSP section of the docs first, since a policy that is too strict will break console features.
