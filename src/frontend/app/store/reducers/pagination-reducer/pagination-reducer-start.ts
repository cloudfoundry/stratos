export function paginationStart(state) {
  return {
    ...state,
    fetching: true,
    error: false,
    message: '',
  };
}

