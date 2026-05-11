// Pagination adapter for the k8s API. K8s uses a `continue` token model
// rather than CF's `totalResults` envelope — the server returns a chunk
// of items plus an opaque cursor the client passes back via `?continue=`
// to fetch the next page. There is no total count, only a best-effort
// `remainingItemCount` populated for some resource types.
//
// `KubePagedResponse<T>` flattens the native shape into a Stratos-shaped
// envelope so consumers don't have to know about k8s pagination details.
// `_meta` carries tristate / error info per the Stratos pattern.

import { StratosError, StratosMeta } from './kube-types';

// Native k8s list response shape. The `metadata.continue` token is opaque
// — clients echo it verbatim.
export interface KubeListResponse<T> {
  apiVersion?: string;
  kind?: string;
  metadata?: {
    resourceVersion?: string;
    continue?: string;
    remainingItemCount?: number;
  };
  items: T[];
}

export interface KubePagedResponse<T> {
  items: T[];
  metadata?: {
    continue?: string;
    resourceVersion?: string;
    remainingItemCount?: number;
  };
  _meta?: StratosMeta;
}

// Adapt a native k8s list response into the Stratos envelope. Stamps
// `kubeGuid` for caller convenience (returned via metadata? no — meta
// is for tristate; we stamp on items downstream by the data service).
//
// The `errors` parameter lets the caller attach envelope-scoped errors
// when the request partially failed (e.g. one of N CNSI-list legs).
export function adaptKubeListResponse<T>(
  nativeList: KubeListResponse<T> | null | undefined,
  _kubeGuid: string,
  errors?: StratosError[],
): KubePagedResponse<T> {
  const items = nativeList?.items ?? [];
  const meta = nativeList?.metadata;
  const _meta: StratosMeta | undefined = errors && errors.length > 0
    ? { errors: errors.slice(0, 5) }
    : undefined;
  return {
    items,
    metadata: meta
      ? {
        continue: meta.continue,
        resourceVersion: meta.resourceVersion,
        remainingItemCount: meta.remainingItemCount,
      }
      : undefined,
    _meta,
  };
}

// Default page size used by the data services when paging through a
// list. Matches the legacy effects' `?limit=500`.
export const KUBE_LIST_DEFAULT_LIMIT = 500;
