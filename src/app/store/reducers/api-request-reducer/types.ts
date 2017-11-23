export const rootUpdatingKey = '_root_';
export interface ActionState {
  busy: boolean;
  error: boolean;
  message: string;
}

export interface DeleteActionState extends ActionState {
  deleted: boolean;
}

export const defaultActionState = {
  busy: false,
  error: false,
  message: ''
};

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
export interface EntityRequestState {
  fetching: boolean;
  updating: UpdatingSection;
  creating: boolean;
  deleting: DeleteActionState;
  error: boolean;
  response: any;
  message: string;
}

export const defaultEntityRequest = {
  fetching: false,
  updating: {
    _root_: { ...defaultActionState }
  },
  creating: false,
  error: false,
  deleting: { ...defaultDeletingActionState },
  response: null,
  message: ''
};

export type IRequestAction = [
  string,
  string,
  string
];
