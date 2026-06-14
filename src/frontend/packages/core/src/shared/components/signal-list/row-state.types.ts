export interface RowsState {
  [rowUID: string]: RowState;
}

export interface RowState {
  busy?: boolean;
  error?: boolean;
  message?: string | null;
  blocked?: boolean;
  highlighted?: boolean;
  deleting?: boolean;
  warning?: boolean;
  disabled?: boolean;
  [customState: string]: any;
}

export const getDefaultRowState = (): RowState => ({
  busy: false,
  error: false,
  blocked: false,
  deleting: false,
  message: null
});
