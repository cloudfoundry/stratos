export function paginationStart(state, action) {
  const page = action.apiAction.pageNumber || state.currentPage;
  return {
    ...state,
    pageRequests: {
      ...state.pageRequests,
      [page]: {
        busy: true,
        error: false,
        message: ''
      }
    }
  };
}
