import { AppState } from './../app-state';
export const recentlyVisitedSelector = <T extends AppState>(state: T) => state.recentlyVisited;
