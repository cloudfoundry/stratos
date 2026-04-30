export interface ActionWithEndpoint {
  endpointGuid?: string;
  cnsiGuid?: string;
}

export function getActionEndpoint(action: ActionWithEndpoint): string {
  const cnsi = action.endpointGuid ?? action.cnsiGuid;
  if (!cnsi) {
    throw new Error('getActionEndpoint: action has no endpointGuid or cnsiGuid');
  }
  return cnsi;
}

export interface V3Pagination {
  totalPages: number;
  totalResults: number;
}

export interface V3PagedResponse<T> {
  pagination: V3Pagination;
  resources: T[];
}

type JetstreamShaped<T> = Record<string, V3PagedResponse<T> | V3PagedResponse<T>[]>;

const firstResponse = <T>(value: V3PagedResponse<T> | V3PagedResponse<T>[]): V3PagedResponse<T> =>
  Array.isArray(value) ? value[0] : value;

export const v3PaginationConfig = {
  getEntitiesFromResponse: <T>(response: V3PagedResponse<T>): T[] => response.resources,

  getTotalPages: <T>(jetstreamResponse: JetstreamShaped<T>): number =>
    Object.values(jetstreamResponse).reduce((max, value) => {
      const resp = firstResponse(value);
      const pages = resp?.pagination?.totalPages ?? 0;
      return pages > max ? pages : max;
    }, 0),

  getTotalEntities: <T>(jetstreamResponse: JetstreamShaped<T>): number =>
    Object.values(jetstreamResponse).reduce((sum, value) => {
      const resp = firstResponse(value);
      return sum + (resp?.pagination?.totalResults ?? 0);
    }, 0),

  getPaginationParameters: (page: number): Record<string, string> => ({
    page: String(page),
    per_page: '100',
  }),
};

export interface StratosShape<TFlat> {
  metadata: {
    guid: string;
    url: string;
    created_at: string;
    updated_at: string;
  };
  entity: TFlat & Record<string, unknown>;
}

function readPath(obj: unknown, path: string): unknown {
  return path.split('.').reduce<unknown>((acc, key) => {
    if (acc && typeof acc === 'object' && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
}

export function v3ToStratosShape<TFlat extends { guid: string }>(
  fieldRenames: Record<string, string>
): (resource: TFlat) => StratosShape<TFlat> {
  return (resource) => {
    const renamed: Record<string, unknown> = {};
    for (const [v3Path, v2Key] of Object.entries(fieldRenames)) {
      const value = readPath(resource, v3Path);
      if (value !== undefined) {
        renamed[v2Key] = value;
      }
    }
    const r = resource as TFlat & {
      created_at?: string;
      updated_at?: string;
      createdAt?: string;
      updatedAt?: string;
    };
    return {
      metadata: {
        guid: resource.guid,
        url: '',
        created_at: r.createdAt ?? r.created_at ?? '',
        updated_at: r.updatedAt ?? r.updated_at ?? '',
      },
      entity: { ...resource, ...renamed } as TFlat & Record<string, unknown>,
    };
  };
}

/**
 * Idempotent single-resource mapper: wraps a flat Stratos-shape resource
 * (e.g. {guid, name, ...}) into the legacy Stratos APIResource shape
 * ({metadata, entity}) that V2 consumers expect. Pass through if already
 * wrapped.
 */
export function v3SingleResourceMapper<TFlat extends { guid: string }>(
  fieldRenames: Record<string, string> = {}
): (data: unknown) => unknown {
  const adapter = v3ToStratosShape<TFlat>(fieldRenames);
  return (data) => {
    if (!data || typeof data !== 'object') {
      return data;
    }
    const d = data as Record<string, unknown>;
    if (d.metadata && d.entity) {
      return data;
    }
    if (typeof d.guid === 'string') {
      return adapter(data as TFlat);
    }
    return data;
  };
}
