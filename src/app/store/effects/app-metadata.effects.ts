// import { IGetAppMetadataAction } from './../actions/app-metadata.actions';
// import { NormalizedResponse } from '../types/api.types';
// import { StartRequestAction, WrapperRequestActionSuccess } from '../types/request.types';
// import 'rxjs/add/operator/map';
// import 'rxjs/add/operator/mergeMap';

// import { Injectable } from '@angular/core';
// import { Headers, Http, Request } from '@angular/http';
// import { Actions, Effect } from '@ngrx/effects';
// import { Store } from '@ngrx/store';
// import { Observable } from 'rxjs/Observable';

// import {
//   AppMetadataTypes,
//   AppMetadataAction,
//   WrapperAppMetadataFailed,
//   WrapperAppMetadataStart,
//   WrapperAppMetadataSuccess,
// } from '../actions/app-metadata.actions';
// import { AppState } from '../app-state';
// import { environment } from './../../../environments/environment';

// const { proxyAPIVersion, cfAPIVersion } = environment;

// @Injectable()
// export class AppMetadataEffect {

//   constructor(
//     private http: Http,
//     private actions$: Actions,
//     private store: Store<AppState>
//   ) { }

//   @Effect() appMetadataRequestStart$ = this.actions$.ofType<IGetAppMetadataAction>(AppMetadataTypes.APP_METADATA)
//     .mergeMap(appMetadataAction => {
//       const actionType = 'fetch';
//       this.store.dispatch(new StartRequestAction(appMetadataAction, actionType));
//       this.store.dispatch(new WrapperAppMetadataStart(appMetadataAction));
//       const options = { ...appMetadataAction.options };
//       options.url = `/pp/${proxyAPIVersion}/proxy/${cfAPIVersion}/${appMetadataAction.options.url}`;
//       options.headers =
//         this.addBaseHeaders(appMetadataAction.cnis, appMetadataAction.options.headers);

//       return this.http.request(new Request(options))
//         .mergeMap(response => {
//           const data = response.json();
//           const mappedData = {
//             entities: {
//               [appMetadataAction.entityKey]: {
//                 [appMetadataAction.guid]: data
//               }
//             },
//             result: [appMetadataAction.guid]
//           } as NormalizedResponse;
//           return [
//             new WrapperAppMetadataSuccess(
//               data,
//               appMetadataAction
//             ),
//             new WrapperRequestActionSuccess(mappedData, appMetadataAction, actionType),
//           ];
//         })
//         .catch(response => {
//           return Observable.of(new WrapperAppMetadataFailed(response, appMetadataAction));
//         });
//     });

//   addBaseHeaders(cnsi: string, header: Headers): Headers {
//     const cnsiHeader = 'x-cap-cnsi-list';
//     const cnsiPassthroughHeader = 'x-cap-passthrough';
//     const headers = new Headers();
//     headers.set(cnsiHeader, cnsi);
//     headers.set(cnsiPassthroughHeader, 'true');
//     return headers;
//   }

//   getActionFromString(type: string) {
//     return { type };
//   }

// }
