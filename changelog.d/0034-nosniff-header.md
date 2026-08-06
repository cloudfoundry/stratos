[Breaking Changes]
- Jetstream now sends `X-Content-Type-Options: nosniff` on every response, so a browser will not second-guess the content type a response declares. A deployment that serves console assets through a proxy which mislabels them will find those assets rejected rather than silently corrected, so check the content types your proxy emits before upgrading.
