[BugFixes]
- Connecting a Kubernetes endpoint through OIDC or a kubeconfig works
  again. RFC 7519 defines the token expiry claim as a number of seconds
  since the epoch; it was being read as an RFC 3339 string, so no
  conformant token could satisfy it and every attempt failed with
  "can not get Access Token expiry time claim".
- Artifact Hub is available again when it is enabled. The flag was renamed
  from "enabled" to "disabled" when Artifact Hub support landed, but the
  test against it was not inverted, so requests were rejected as disabled
  precisely when the feature was on — which is the default.
- A Helm release whose manifest contains a malformed custom resource is
  now reported to the console as having manifest errors. That branch
  logged the parse failure but left the flag unset, unlike the branch
  beside it.
- kube-score analysis jobs are evicted from the job map when they finish.
  The busy flag was cleared for popeye runs and never for kube-score, and
  the cleanup pass skips busy jobs, so the map grew for as long as the
  analysis container ran.
- Deploying an application no longer panics when a file check fails for
  any reason other than the file being absent — a permission error, a
  symlink loop, or an over-long name left a nil result that was then
  dereferenced.
- The fallback path for the plugin scripts folder contained a stray
  character, so a layout that keeps the scripts under the plugin directory
  never matched the candidate meant to find it.

[Maintainability]
- Every filesystem operation in the analysis container now re-checks, at
  the point of use, that the path still sits beneath the reports
  directory, resolving any ".." before comparing. The paths were already
  built safely, but the guarantee lived in the constructors: an analyzer
  read the job folder and temporary file names directly, so a later change
  setting either from somewhere else would have reached the disk
  unchallenged. The monocular and Artifact Hub cache paths are built from
  validated segments in one place for the same reason.
