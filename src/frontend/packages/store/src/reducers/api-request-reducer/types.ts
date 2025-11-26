import type { EntityCatalogEntityConfig } from '../../entity-catalog/entity-catalog.types';

export enum RequestSectionKeys {
  CF = 'cf',
  Other = 'other'
}

export type TRequestTypeKeys = RequestSectionKeys.CF | RequestSectionKeys.Other;

export const rootUpdatingKey = '_root_';
export interface ActionState {
  busy: boolean;
  error: boolean;
  message: string;
}

// Status of an action
export interface ActionStatus {
  busy: boolean;
  error: boolean;
  message?: string;
  completed: boolean;
}

/**
 * Multi action lists can have different entity types per page
 * We use schemaKey to track this type
 */
export interface ListActionState extends ActionState {
  entityConfig?: EntityCatalogEntityConfig;
  /**
   * Does the collection size exceed the max allowed? Used in conjunction PaginationEntityState maxedMode.
   */
  maxed?: boolean;
  baseEntityConfig?: EntityCatalogEntityConfig;
}

export interface DeleteActionState extends ActionState {
  deleted: boolean;
  [key: string]: unknown; // Index signature for Record<string, unknown> compatibility
}

export const getDefaultActionState = (): ActionState => ({
  busy: false,
  error: false,
  message: ''
});

export const defaultDeletingActionState = {
  busy: false,
  error: false,
  message: '',
  deleted: false
};

export interface UpdatingSection extends Record<string, ActionState> {
  [rootUpdatingKey]: ActionState;
}
export interface RequestInfoState {
  fetching: boolean;
  updating: UpdatingSection;
  creating: boolean;
  deleting: DeleteActionState;
  error: boolean;
  response?: unknown;
  message: string;
}

const defaultRequestState: RequestInfoState = {
  fetching: false,
  updating: {
    [rootUpdatingKey]: getDefaultActionState()
  },
  creating: false,
  error: false,
  deleting: { ...defaultDeletingActionState },
  response: null,
  message: ''
};

export function getDefaultRequestState() {
  return { ...defaultRequestState };
}

export type IRequestArray = [
  string,
  string,
  string,
  string
];

