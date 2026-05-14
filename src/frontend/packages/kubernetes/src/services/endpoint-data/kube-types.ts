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

// ---------------------------------------------------------------------------
// Wave-2 types: nodes, services, endpoints
// ---------------------------------------------------------------------------
// Same convention as KubeNamespace — wire-shape (camelCase per JSON
// payload), client-stamped `kubeGuid`, `metadata.kubeId` mirror, optional
// `_meta` envelope. Field sets are intentionally minimal — we lift from
// the legacy `kubernetes/store/kube.types.ts` only what the wave-2 pages
// actually render. Additional fields can be added without breaking
// callers because the interfaces are open-ended (extra wire fields just
// flow through).

export interface KubeNodeAddress {
  type: string;     // 'InternalIP' | 'ExternalIP' | 'Hostname' | ...
  address: string;
}

export interface KubeNodeCondition {
  type: string;     // 'Ready' | 'MemoryPressure' | 'DiskPressure' | ...
  status: string;   // 'True' | 'False' | 'Unknown'
  reason?: string;
  message?: string;
  lastHeartbeatTime?: string;
  lastTransitionTime?: string;
}

export interface KubeNodeCapacity {
  cpu?: string;
  memory?: string;
  pods?: string;
  [key: string]: string | undefined;
}

export interface KubeNodeStatus {
  capacity?: KubeNodeCapacity;
  allocatable?: KubeNodeCapacity;
  conditions?: KubeNodeCondition[];
  addresses?: KubeNodeAddress[];
  nodeInfo?: {
    kubeletVersion?: string;
    osImage?: string;
    containerRuntimeVersion?: string;
    operatingSystem?: string;
    architecture?: string;
  };
}

export interface KubeNode {
  metadata: KubeObjectMeta;
  spec?: { podCIDR?: string; taints?: { key: string; value?: string; effect: string }[] };
  status?: KubeNodeStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

// k8s Service ports + spec — minimal subset for list rendering.
export interface KubeServicePort {
  name?: string;
  protocol?: string;     // 'TCP' | 'UDP' | ...
  port: number;
  targetPort?: number | string;
  nodePort?: number;
}

export interface KubeServiceSpec {
  type?: string;         // 'ClusterIP' | 'NodePort' | 'LoadBalancer' | ...
  clusterIP?: string;
  ports?: KubeServicePort[];
  selector?: Record<string, string>;
  externalIPs?: string[];
  loadBalancerIP?: string;
  externalName?: string;
}

export interface KubeServiceStatus {
  loadBalancer?: {
    ingress?: Array<{ ip?: string; hostname?: string }>;
  };
}

export interface KubeService {
  metadata: KubeObjectMeta;
  spec?: KubeServiceSpec;
  status?: KubeServiceStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

// k8s Endpoints (v1) — represents the backing endpoints for a Service.
// Subset: address list + ports per subset. Minimal because the legacy
// kubernetes-endpoints page is actually a Stratos endpoint registry view
// (k8s endpoint list), not the k8s `Endpoints` API resource. We carry
// the type for completeness so KubeServiceDataService can fetch it for
// future detail-pane consumers.
export interface KubeEndpointSubset {
  addresses?: Array<{ ip?: string; hostname?: string; nodeName?: string; targetRef?: { kind?: string; name?: string; namespace?: string } }>;
  notReadyAddresses?: Array<{ ip?: string; hostname?: string }>;
  ports?: Array<{ name?: string; port?: number; protocol?: string }>;
}

export interface KubeEndpoint {
  metadata: KubeObjectMeta;
  subsets?: KubeEndpointSubset[];
  kubeGuid: string;
  _meta?: StratosMeta;
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

// ---------------------------------------------------------------------------
// Wave-3 generic resource types: configMap, secret, deployment, replicaSet,
// statefulSet, persistentVolume, persistentVolumeClaim, storageClass, job,
// role, clusterRole, serviceAccount.
//
// Same convention as wave-2: wire-shape (camelCase per JSON payload),
// client-stamped `kubeGuid`, `metadata.kubeId` mirror, optional `_meta`
// envelope. Field sets are the minimum legacy list pages render — extra
// wire fields just flow through because the interfaces stay open.
// ---------------------------------------------------------------------------

export interface KubeConfigMap {
  metadata: KubeObjectMeta;
  data?: Record<string, string>;
  binaryData?: Record<string, string>;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeSecret {
  metadata: KubeObjectMeta;
  type?: string;
  data?: Record<string, string>;
  stringData?: Record<string, string>;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeDeploymentSpec {
  replicas?: number;
  strategy?: { type?: string };
  selector?: { matchLabels?: Record<string, string> };
}

export interface KubeDeploymentStatus {
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  updatedReplicas?: number;
  conditions?: Array<{ type?: string; status?: string; reason?: string; message?: string }>;
}

export interface KubeDeployment {
  metadata: KubeObjectMeta;
  spec?: KubeDeploymentSpec;
  status?: KubeDeploymentStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeReplicaSetSpec {
  replicas?: number;
  selector?: { matchLabels?: Record<string, string> };
}

export interface KubeReplicaSetStatus {
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
}

export interface KubeReplicaSet {
  metadata: KubeObjectMeta;
  spec?: KubeReplicaSetSpec;
  status?: KubeReplicaSetStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeStatefulSetSpec {
  replicas?: number;
  serviceName?: string;
}

export interface KubeStatefulSetStatus {
  replicas?: number;
  readyReplicas?: number;
}

export interface KubeStatefulSet {
  metadata: KubeObjectMeta;
  spec?: KubeStatefulSetSpec;
  status?: KubeStatefulSetStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubePersistentVolumeSpec {
  capacity?: { storage?: string };
  accessModes?: string[];
  persistentVolumeReclaimPolicy?: string;
  storageClassName?: string;
  claimRef?: { namespace?: string; name?: string };
}

export interface KubePersistentVolumeStatus {
  phase?: string;
  reason?: string;
  message?: string;
}

export interface KubePersistentVolume {
  metadata: KubeObjectMeta;
  spec?: KubePersistentVolumeSpec;
  status?: KubePersistentVolumeStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubePersistentVolumeClaimSpec {
  storageClassName?: string;
  accessModes?: string[];
  resources?: { requests?: { storage?: string } };
  volumeName?: string;
}

export interface KubePersistentVolumeClaimStatus {
  phase?: string;
  capacity?: { storage?: string };
}

export interface KubePersistentVolumeClaim {
  metadata: KubeObjectMeta;
  spec?: KubePersistentVolumeClaimSpec;
  status?: KubePersistentVolumeClaimStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeStorageClass {
  metadata: KubeObjectMeta;
  provisioner?: string;
  reclaimPolicy?: string;
  volumeBindingMode?: string;
  allowVolumeExpansion?: boolean;
  parameters?: Record<string, string>;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeJobSpec {
  parallelism?: number;
  completions?: number;
  backoffLimit?: number;
}

export interface KubeJobStatus {
  active?: number;
  succeeded?: number;
  failed?: number;
  startTime?: string;
  completionTime?: string;
  conditions?: Array<{ type?: string; status?: string; reason?: string }>;
}

export interface KubeJob {
  metadata: KubeObjectMeta;
  spec?: KubeJobSpec;
  status?: KubeJobStatus;
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubePolicyRule {
  apiGroups?: string[];
  resources?: string[];
  verbs?: string[];
  resourceNames?: string[];
  nonResourceURLs?: string[];
}

export interface KubeRole {
  metadata: KubeObjectMeta;
  rules?: KubePolicyRule[];
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeClusterRole {
  metadata: KubeObjectMeta;
  rules?: KubePolicyRule[];
  kubeGuid: string;
  _meta?: StratosMeta;
}

export interface KubeServiceAccount {
  metadata: KubeObjectMeta;
  secrets?: Array<{ name?: string; namespace?: string }>;
  imagePullSecrets?: Array<{ name?: string }>;
  automountServiceAccountToken?: boolean;
  kubeGuid: string;
  _meta?: StratosMeta;
}

// --- Analysis (wave-2) ---
//
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
