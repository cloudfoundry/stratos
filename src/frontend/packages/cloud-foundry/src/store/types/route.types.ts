import type { APIResource } from '../../../../store/src/types/api.types';
import type { IApp } from '../../cf-api.types';


export class Route implements Record<string, unknown> {
  /* tslint:disable-next-line:variable-name  */
  public domain_guid: string;
  /* tslint:disable-next-line:variable-name  */
  public space_guid: string;
  public host?: string;
  public path?: string;
  public port?: number;

  [key: string]: unknown;

  constructor(
    domain_guid: string,
    space_guid: string,
    host?: string,
    path?: string,
    port?: number,
  ) {
    this.domain_guid = domain_guid;
    this.space_guid = space_guid;
    this.host = host;
    this.path = path;
    this.port = port;
  }
}

export interface RouteMode {
  id: string;
  label: string;
  submitLabel: string;
}


export class CfRoute {
  /* tslint:disable-next-line:variable-name  */
  domain_guid!: string;
  /* tslint:disable-next-line:variable-name  */
  space_guid!: string;
  path?: string;
  host?: string;
  port?: number;
  apps?: APIResource<IApp>[];
}
