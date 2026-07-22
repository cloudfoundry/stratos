export interface RoutingEvent {
  id: number;
  url: string;
  urlAfterRedirects: string;
  state: {
    url: string;
    params: {
      [key: string]: string;
    }
    queryParams: {
      [key: string]: string;
    }
  };
}
