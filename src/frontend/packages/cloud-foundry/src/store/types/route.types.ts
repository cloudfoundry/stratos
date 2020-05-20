import { APIResource } from '../../../../store/src/types/api.types';
import { IApp } from '../../cf-api.types';


export class Route {
  constructor(
    /* tslint:disable-next-line:variable-name  */
    public domain_guid: string,
    /* tslint:disable-next-line:variable-name  */
    public space_guid: string,
    public host?: string,
    public path?: string,
    public port?: number,
  ) { }
}

export interface RouteMode {
  id: string;
  label: string;
  submitLabel: string;
}


export class CfRoute {
  /* tslint:disable-next-line:variable-name  */
  domain_guid: string;
  /* tslint:disable-next-line:variable-name  */
  space_guid: string;
  path?: string;
  host?: string;
  port?: number;
  apps?: APIResource<IApp>[];
}
