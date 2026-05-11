// Stratos-signal-native types for the kubernetes data layer. Mirrors the
// CF endpoint-data `stratos-types` shape — all wire-bearing interfaces
// carry an optional `_meta` envelope for the tristate error model so
// consumers can distinguish "field was not fetched" from "field is empty".
//
// We intentionally avoid pulling in the legacy `KubernetesNamespace` /
// `KubeAPIResource` types from `kubernetes/store/kube.types.ts` — the
// store directory is wave-3 deletion territory. The signal layer carries
// its own minimal native-shape interfaces so the new code compiles even
// after wave-3 deletes the store.

export interface StratosMeta {
  unavailable?: string[];
  errors?: StratosError[];
}

export interface StratosError {
  scope?: 'envelope' | 'row';
  code: 'UNAUTHORIZED' | 'FETCH_ERROR' | 'PARSE_ERROR';
  title: string;
  detail?: string;
  guid?: string;
  affected?: string[];
}

// K8s native object metadata. We keep the wire shape (camelCase per JSON
// payload) and stamp `kubeId` server-side so cross-cluster lists can
// associate rows with their endpoint.
export interface KubeObjectMeta {
  name: string;
  namespace?: string;
  uid?: string;
  resourceVersion?: string;
  creationTimestamp?: string;
  deletionTimestamp?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  kubeId?: string;
}

export interface KubeBaseStatus {
  phase?: string;
}

export interface KubeNamespaceSpec {
  finalizers?: string[];
}

// Minimal k8s namespace shape — `metadata.kubeId` is stamped client-side
// in the data service so the row can render its endpoint context without
// a separate lookup. `_meta` mirrors CF's tristate envelope.
export interface KubeNamespace {
  metadata: KubeObjectMeta;
  spec?: KubeNamespaceSpec;
  status?: KubeBaseStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

// K8s `/version` response.
export interface KubeVersionInfo {
  major?: string;
  minor?: string;
  gitVersion?: string;
  gitCommit?: string;
  platform?: string;
}

// Aggregate snapshot of all cluster-scoped state held by the endpoint
// data service. Mirrors `StEndpointData` for CF.
export interface KubeEndpointData {
  kubeGuid: string;
  kubeVersion: string | null;
  nodeCount: number;
  namespaceCount: number;
  namespaces: KubeNamespace[];
  errors: StratosError[];
}

// --- Helm types (wave-2 helm slice) ---
//
// HelmRelease mirrors the legacy `workload.types.HelmRelease` shape but
// lives here so the signal-native helm consumers don't have to import
// from the soon-to-be-deleted store/ tree. The wire shape is unchanged
// — Jetstream returns `info.last_deployed` / `info.first_deployed` as
// proto-timestamp objects ({ seconds, nanos }), which we normalize into
// JS Dates in the data service. `kubeGuid` is stamped client-side to
// match the namespace-style row tagging.

export interface HelmReleaseChartMetadata {
  name?: string;
  version?: string;
  icon?: string;
  description?: string;
  sources?: string[];
}

export interface HelmReleaseChart {
  // `values` is a free-form value map (any).
  values?: Record<string, unknown>;
  metadata: HelmReleaseChartMetadata;
}

export interface HelmReleaseInfo {
  // Proto-timestamp on the wire ({ seconds, nanos }), JS Date after
  // mapping. We keep this loose — consumers go through `lastDeployed`
  // / `firstDeployed` for the normalized form.
  last_deployed?: unknown;
  first_deployed?: unknown;
  notes?: string;
  status?: string;
}

export interface HelmRelease {
  endpointId: string;
  guid: string;
  name: string;
  namespace: string;
  version?: string;
  status: string;
  lastDeployed?: Date;
  firstDeployed?: Date;
  info: HelmReleaseInfo;
  config?: unknown;
  chart: HelmReleaseChart;
  kubeGuid?: string;
  _meta?: StratosMeta;
}

// HelmReleaseHistoryRevision / HelmReleaseHistory carried over from the
// legacy types so the helm-release-history-tab can be ported without
// double-defining shapes.
export interface HelmReleaseHistoryRevision {
  first_deployed?: string;
  last_deployed?: string;
  deleted?: boolean;
  description?: string;
  status?: string;
  revision?: number;
  chart?: HelmReleaseChartMetadata;
  values?: Record<string, unknown>;
}

export interface HelmReleaseHistory {
  endpointId: string;
  releaseTitle: string;
  revisions: HelmReleaseHistoryRevision[];
}

// --- Monocular chart types ---
//
// Monocular's Chart shape is JSON:API-style: each chart carries
// `id`, `type`, `attributes` (name, description, icon, repo info, etc.)
// and `relationships`. We mirror just enough to type the list/card.
// `monocularEndpointId` is stamped server-side when the chart comes
// from an Artifact-Hub-backed endpoint; absent for the bundled
// stratos repo.

export interface MonocularRepo {
  name: string;
  url?: string;
}

export interface MonocularChartAttributes {
  name: string;
  description?: string;
  icon?: string;
  repo: MonocularRepo;
  home?: string;
  sources?: string[];
  keywords?: string[];
}

export interface MonocularChart {
  id: string;
  type?: string;
  attributes: MonocularChartAttributes;
  relationships?: Record<string, unknown>;
  monocularEndpointId?: string;
  // Promoted from attributes.name for convenience (legacy contract).
  name: string;
  _meta?: StratosMeta;
}

// --- Helm install / upgrade payload types ---
//
// These mirror `helm/store/helm.types.ts` 1:1 so the signal-native
// dialogs can build the same wire payloads the legacy effects sent.
// We keep them here so the dialogs don't need to import from the
// wave-3-deletion store tree.

export interface HelmChartReference {
  endpoint?: string;
  name: string;
  repo: string;
  version: string;
}

export interface HelmUpgradeInstallPayload {
  monocularEndpoint: string | null;
  values: string;
  chart: HelmChartReference;
  chartUrl: string;
}

export interface HelmInstallPayload extends HelmUpgradeInstallPayload {
  endpoint: string;
  releaseName: string;
  releaseNamespace: string;
}

export interface HelmUpgradePayload extends HelmUpgradeInstallPayload {
  restartPods?: boolean;
}
