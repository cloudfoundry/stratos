[Maintainability]
- Removed the `Docker Build and Push` workflow and the base-image push
  workflow. The `stratos-ui` and `stratos-backend` component images build
  from SUSE-era `splatform` bases carrying Node 12, which cannot compile the
  current source, so the workflow failed on every release and never pushed an
  image; the base-image workflow had been a silent no-op for years. The
  all-in-one image is unaffected and still publishes from the release
  workflow. See [#5907](https://github.com/cloudfoundry/stratos/issues/5907).

[Chores]
- Corrected the deployment documentation, which promised a Helm chart in the
  release artifacts and a chart repository at `cloudfoundry.github.io/stratos`.
  Neither exists. The Kubernetes pages and the component-image instructions in
  the DevOps and release guides now state that this path does not currently
  work and point at the working Cloud Foundry and all-in-one options.
