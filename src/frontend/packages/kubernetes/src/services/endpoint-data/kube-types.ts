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
