[Features]
- Jetstream now sends `X-Content-Type-Options: nosniff` on every response, so a browser will not second-guess the content type a response declares. Deployments that serve console assets through a proxy which mislabels them may need that corrected.
