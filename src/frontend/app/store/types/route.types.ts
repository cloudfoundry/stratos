export class Route {
  constructor(
    public domain_guid: string,
    public space_guid: string,
    public host?: string,
    public path?: string,
    public port?: number,
    public isTCP: boolean = false
  ) {
    if (this.path) {
      this.path = '/' + this.path;
    }
  }
}

export interface RouteMode {
  id: string;
  label: string;
}
