[Features]
- The all-in-one container image is now published for `linux/arm64` as well
  as `linux/amd64`. It previously ran only on amd64, so it could not be used
  on arm64 Kubernetes nodes or on Apple Silicon without building it locally.
  The release payload now carries one Linux binary per architecture and the
  Dockerfile selects on `TARGETARCH`.
