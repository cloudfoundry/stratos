import { HttpErrorResponse } from '@angular/common/http';

import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { isHttpErrorResponse } from '../../../jetstream.helpers';

// TODO: RC move to types

export enum BackupEndpointTypes {
  ENDPOINT = 'endpoint',
  CONNECT = 'connect',
  ALL_CONNECT = 'all_connect'
}

export interface BackupEndpointsConfig<T> {
  [endpointId: string]: T;
}

export interface BaseEndpointConfig {
  [BackupEndpointTypes.ENDPOINT]: boolean;
  [BackupEndpointTypes.CONNECT]: boolean;
  [BackupEndpointTypes.ALL_CONNECT]: boolean;
}

// type BackupEndpoint = Omit<BackupEndpointConfig, 'entity'>;

export interface BackupEndpointConfigUI extends BaseEndpointConfig {
  entity: EndpointModel;
}

// @Injectable()
export class BackupRestoreEndpointService {

  createError(err: any): string {
    // TODO: RC tidy. move generic
    const httpResponse: HttpErrorResponse = isHttpErrorResponse(err);
    if (httpResponse) {
      if (httpResponse.error) {
        if (typeof (httpResponse.error) === 'string') {
          return httpResponse.error + ` (${httpResponse.status})`;
        }
        return httpResponse.error.error + ` (${httpResponse.status})`;
      }
      return JSON.stringify(httpResponse.error) + ` (${httpResponse.status})`;
    }
    return err.message;
  }

  // hasChanges = new BehaviorSubject(false);
  // hasChanges$ = this.hasChanges.asObservable();
  // allChanged = new BehaviorSubject(false);
  // allChanged$ = this.allChanged.asObservable();

  // state: BackupEndpointsConfig<BackupEndpointConfigUI> = {};
  // password: string;


  // constructor(
  //   private store: Store<GeneralEntityAppState>,
  //   private http: HttpClient
  // ) {

  // }

  // // State Related
  // initialize(endpoints: EndpointModel[]) {
  //   endpoints.forEach(entity => {
  //     this.state[entity.guid] = {
  //       [BackupRestoreTypes.ENDPOINT]: false,
  //       [BackupRestoreTypes.CONNECT]: false,
  //       [BackupRestoreTypes.ALL_CONNECT]: false,
  //       entity
  //     };
  //   });
  //   this.validate();
  // }

  // validate() {
  //   const endpoints = Object.values(this.state);
  //   endpoints.forEach(endpoint => {
  //     if (!endpoint[BackupRestoreTypes.ENDPOINT]) {
  //       endpoint[BackupRestoreTypes.CONNECT] = false;
  //       endpoint[BackupRestoreTypes.ALL_CONNECT] = false;
  //     }
  //     if (endpoint[BackupRestoreTypes.ALL_CONNECT] && this.canBackup(endpoint.entity, BackupRestoreTypes.CONNECT)) {
  //       endpoint[BackupRestoreTypes.CONNECT] = true;
  //     }
  //   });

  //   const hasChanges = !!endpoints.find(endpoint =>
  //     endpoint[BackupRestoreTypes.ENDPOINT] ||
  //     endpoint[BackupRestoreTypes.CONNECT] ||
  //     endpoint[BackupRestoreTypes.ALL_CONNECT]
  //   );
  //   this.hasChanges.next(hasChanges);
  //   const allChanged = endpoints.every(endpoint => {
  //     const e = !this.canBackup(endpoint.entity, BackupRestoreTypes.ENDPOINT) || endpoint[BackupRestoreTypes.ENDPOINT];
  //     const c = !this.canBackup(endpoint.entity, BackupRestoreTypes.CONNECT) || endpoint[BackupRestoreTypes.CONNECT];
  //     const aC = !this.canBackup(endpoint.entity, BackupRestoreTypes.ALL_CONNECT) || endpoint[BackupRestoreTypes.ALL_CONNECT];
  //     return e && c && aC;
  //   }

  //   );
  //   this.allChanged.next(allChanged);
  // }

  // canBackup(endpoint: EndpointModel, type: BackupRestoreTypes): boolean {
  //   // Can always back up endpoint
  //   if (type === BackupRestoreTypes.ENDPOINT) {
  //     return true;
  //   }

  //   // All other settings require endpoint to be backed up
  //   if (!this.state[endpoint.guid][BackupRestoreTypes.ENDPOINT]) {
  //     return false;
  //   }

  //   const epType = entityCatalog.getEndpoint(endpoint.cnsi_type, endpoint.sub_type).definition;
  //   // The endpoint type supports connection details
  //   if (epType.unConnectable) {
  //     return false;
  //   }

  //   // Are all connection details backed up anyway?
  //   // Does the user have connection details for this endpoint?
  //   if (type === BackupRestoreTypes.CONNECT) {
  //     return !this.state[endpoint.guid][BackupRestoreTypes.ALL_CONNECT] &&
  //       endpoint.connectionStatus === 'connected';
  //     // return !this.service.state[endpoint.guid][BackupRestoreTypes.CONNECT];
  //   }

  //   return true;
  // }

  // selectAll() {
  //   Object.values(this.state).forEach(endpoint => {
  //     if (this.canBackup(endpoint.entity, BackupRestoreTypes.ENDPOINT)) {
  //       endpoint[BackupRestoreTypes.ENDPOINT] = true;
  //     }
  //     if (this.canBackup(endpoint.entity, BackupRestoreTypes.CONNECT)) {
  //       endpoint[BackupRestoreTypes.CONNECT] = true;
  //     }
  //     if (this.canBackup(endpoint.entity, BackupRestoreTypes.ALL_CONNECT)) {
  //       endpoint[BackupRestoreTypes.ALL_CONNECT] = true;
  //     }
  //   });
  //   this.validate();
  // }

  // selectNone() {
  //   Object.values(this.state).forEach(endpoint => {
  //     endpoint[BackupRestoreTypes.ENDPOINT] = false;
  //     endpoint[BackupRestoreTypes.CONNECT] = false;
  //     endpoint[BackupRestoreTypes.ALL_CONNECT] = false;
  //   });
  //   this.validate();
  // }

  // // Request Related

  // createBackup(): Observable<Blob> {
  //   const url = '/pp/v1/backup/endpoints';
  //   const fromObject = {};
  //   const params: HttpParams = new HttpParams({
  //     fromObject,
  //     encoder: new BrowserStandardEncoder()
  //   });

  //   return this.getSessionData().pipe(
  //     switchMap(ses => this.http.post(url, this.createBodyToSend(ses), {
  //       params
  //     })),
  //     map(res => {
  //       console.log('Response: ', res);
  //       return new Blob([JSON.stringify(res)]);
  //     }),
  //     first(),
  //   );
  // }

  // private createBodyToSend(sd: SessionData): BackupEndpointRequestData {
  //   const state: BackupEndpointsConfig<BackupEndpointConfigRequest> = Object.entries(this.state).reduce((res, [endpointId, endpoint]) => {
  //     const { entity, ...rest } = endpoint;
  //     const requestConfig: BackupEndpointConfigRequest = {
  //       ...rest,
  //     };
  //     res[endpointId] = requestConfig;
  //     return res;
  //   }, {});
  //   return {
  //     state,
  //     userId: this.getUserIdFromSessionData(sd),
  //     password: this.password
  //   };
  // }

  // private getUserIdFromSessionData(sd: SessionData): string {
  //   if (sd && sd.user) {
  //     return sd.user.guid;
  //   }
  //   return null;
  // }

  // private getSessionData(): Observable<SessionData> {
  //   return this.store.select(s => s.auth).pipe(
  //     filter(auth => !!(auth && auth.sessionData)),
  //     map((auth: AuthState) => auth.sessionData),
  //     first()
  //   );
  // }



}
