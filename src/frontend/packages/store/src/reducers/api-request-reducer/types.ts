import { EntityCatalogueEntityConfig } from '../../../../core/src/core/entity-catalogue/entity-catalogue.types';

export const enum RequestSectionKeys {
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

/**
 * Multi action lists can have different entity types per page
 * We use schemaKey to track this type
 */
export interface ListActionState extends ActionState {
  entityConfig?: EntityCatalogueEntityConfig;
  /**
   * Does the collection size exceed the max allowed? Used in conjunction PaginationEntityState maxedMode.
   */
  maxed?: boolean;
  baseEntityConfig?: EntityCatalogueEntityConfig;
}

export interface DeleteActionState extends ActionState {
  deleted: boolean;
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

export interface UpdatingSection {
  _root_: ActionState;
  [key: string]: ActionState;
}
export interface RequestInfoState {
  fetching: boolean;
  updating: UpdatingSection;
  creating: boolean;
  deleting: DeleteActionState;
  error: boolean;
  response: any;
  message: string;
}

const defaultRequestState = {
  fetching: false,
  updating: {
    _root_: getDefaultActionState()
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

