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

// Analysis report wire shape — sourced from the analysis backend plugin
// at /pp/v1/analysis/reports/:endpoint. Mirrors the legacy
// `kubernetes/store/kube.types.ts#AnalysisReport`; duplicated here so
// the signal layer compiles after wave-3 deletes the store directory.
//
// `report` is intentionally typed as a structured record because each
// analyzer (popeye / kubescore / etc.) returns a different schema; the
// per-format helpers live in `services/*-report.helper.ts` and mutate
// `report` in place to attach a normalized alert map.
export interface AnalysisReport {
  id: string;
  endpoint: string;
  type: string;
  name: string;
  path: string;
  created: Date;
  read: boolean;
  status: string;
  duration: number;
  report?: Record<string, unknown>;
  title?: string;
  format?: string;
  _meta?: StratosMeta;
}
