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

// --- Pods (wave-2) ---

// Per-container status as reported by k8s `containerStatuses`. We keep
// only the fields the list pages render — restart count drives the
// "Restarts" column, and the `state` shape is needed to compute the
// expanded pod status (Running / Waiting / Terminated etc.).
export interface KubePodContainerStatus {
  name?: string;
  ready?: boolean;
  restartCount?: number;
  image?: string;
  imageID?: string;
  containerID?: string;
  state?: Record<string, { reason?: string; message?: string; exitCode?: number; startedAt?: string }>;
  lastState?: Record<string, { reason?: string; message?: string; exitCode?: number; startedAt?: string }>;
}

export interface KubePodStatus {
  phase?: string;
  message?: string;
  reason?: string;
  hostIP?: string;
  podIP?: string;
  startTime?: string;
  containerStatuses?: KubePodContainerStatus[];
  initContainerStatuses?: KubePodContainerStatus[];
  qosClass?: string;
  nominatedNodeName?: string;
}

export interface KubePodSpec {
  nodeName?: string;
  serviceAccountName?: string;
  containers?: { name: string; image?: string }[];
}

// K8s pod wire shape. Like KubeNamespace, we stamp `kubeGuid` client-side
// in the data service so cross-cluster lists can disambiguate rows.
//
// `expandedStatus` is a derived projection (not a wire field) computed by
// the data service when it normalizes the response — restart-count is a
// sum across container statuses, and the human-friendly status string is
// derived from `status.phase` + container `state.waiting.reason` for
// CrashLoopBackOff / ImagePullBackOff / etc. Keeping it on the row keeps
// the signal-config columns simple and matches the legacy list-config
// shape so column sort/filter works the same.
export interface KubePod {
  metadata: KubeObjectMeta;
  spec?: KubePodSpec;
  status?: KubePodStatus;
  kubeGuid: string;
  expandedStatus?: {
    status: string;
    restarts: number;
  };
  _meta?: StratosMeta;
}
