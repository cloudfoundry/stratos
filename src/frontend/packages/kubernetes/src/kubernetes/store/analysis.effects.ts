import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ApplicationRef, Injectable } from '@angular/core';
import { Actions, createEffect, ofType } from '@ngrx/effects';
import { Store } from '@ngrx/store';
import { catchError, flatMap, mergeMap } from 'rxjs/operators';

import { environment } from '../../../../core/src/environments/environment';
import { type AppState, entityCatalog, type NormalizedResponse, WrapperRequestActionSuccess } from '../../../../store/src/public-api';
import type { ApiRequestTypes } from '../../../../store/src/reducers/api-request-reducer/request-helpers';
import { StartRequestAction, WrapperRequestActionFailed } from '../../../../store/src/types/request.types';
import { KubeScoreReportHelper } from '../services/kubescore-report.helper';
import { PopeyeReportHelper } from '../services/popeye-report.helper';
import {
  DELETE_ANALYSIS_REPORT_TYPES,
  type DeleteAnalysisReport,
  GET_ANALYSIS_REPORT_BY_ID_TYPES,
  GET_ANALYSIS_REPORTS_BY_PATH_TYPES,
  GET_ANALYSIS_REPORTS_TYPES,
  type GetAnalysisReportById,
  type GetAnalysisReports,
  type GetAnalysisReportsByPath,
  RUN_ANALYSIS_REPORT_TYPES,
  type RunAnalysisReport,
} from './analysis.actions';
import type { AnalysisReport } from './kube.types';

@Injectable({
  providedIn: 'root'
})
export class AnalysisEffects {
  proxyAPIVersion = environment.proxyAPIVersion;

  constructor(
    private http: HttpClient,
    private actions$: Actions,
    private store: Store<AppState>,
    private appRef: ApplicationRef
  ) { }

  
  fetchAnalysisReports$ = createEffect(() => this.actions$.pipe(
    ofType<GetAnalysisReports>(GET_ANALYSIS_REPORTS_TYPES[0]),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers
      };
      const url = `/pp/${this.proxyAPIVersion}/analysis/reports/${action.kubeGuid}`;
      const entityKey = entityCatalog.getEntityKey(action);
      return this.http.get(url, requestArgs).pipe(
        mergeMap(response => {
          const res: NormalizedResponse = {
            entities: { [entityKey]: {} },
            result: []
          };
          const items = response as AnalysisReport[];
          items.forEach((item: AnalysisReport) => {
            const id = item.id;
            res.entities[entityKey][id] = item;
            res.result.push(id);
          });
          this.appRef.tick();
          return [new WrapperRequestActionSuccess(res, action)];
        }),
        catchError(error => {
          this.appRef.tick();
          return [
            new WrapperRequestActionFailed(error.message, action, 'fetch', {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: error.status ? `${error.status}` : '500',
              message: 'Kubernetes Analysis Report request error',
              error
            })
          ];
        })
      );
    })
  ));

  
  fetchAnalysisReportById$ = createEffect(() => this.actions$.pipe(
    ofType<GetAnalysisReportById>(GET_ANALYSIS_REPORT_BY_ID_TYPES[0]),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));

      const url = `/pp/${this.proxyAPIVersion}/analysis/reports/${action.kubeGuid}/${action.guid}`;
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers,
      };
      const entityKey = entityCatalog.getEntityKey(action);

      return this.http.get(url, requestArgs).pipe(
        mergeMap(response => {
          const report = response as AnalysisReport;
          this.processReport(report);

          const res: NormalizedResponse = {
            entities: {
              [entityKey]: {
                [action.guid]: report
              }
            },
            result: [action.guid]
          };
          this.appRef.tick();
          return [new WrapperRequestActionSuccess(res, action)];
        }),
        catchError(error => {
          this.appRef.tick();
          return [
            new WrapperRequestActionFailed(error.message, action, 'fetch', {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: error.status ? `${error.status}` : '500',
              message: 'Kubernetes Analysis Report request error',
              error
            })
          ];
        })
      );
    })
  ));

  
  fetchAnalysisReportByPath$ = createEffect(() => this.actions$.pipe(
    ofType<GetAnalysisReportsByPath>(GET_ANALYSIS_REPORTS_BY_PATH_TYPES[0]),
    flatMap(action => {
      this.store.dispatch(new StartRequestAction(action));

      const url = `/pp/${this.proxyAPIVersion}/analysis/completed/${action.kubeGuid}/${action.path}`;
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers,
      };
      const schema = action.entity[0];
      const entityKey = entityCatalog.getEntityKey(action);
      return this.http.get(url, requestArgs).pipe(
        mergeMap((response: AnalysisReport[]) => {
          const res: NormalizedResponse = {
            entities: {
              [entityKey]: {}
            },
            result: []
          };
          response.forEach(report => {
            const guid = schema.getId(report);
            res.entities[entityKey][guid] = report;
            res.result.push(guid);
          });
          this.appRef.tick();
          return [new WrapperRequestActionSuccess(res, action)];
        }),
        catchError(error => {
          this.appRef.tick();
          return [
            new WrapperRequestActionFailed(error.message, action, 'fetch', {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: error.status ? `${error.status}` : '500',
              message: 'Kubernetes Analysis Report request error',
              error
            })
          ];
        })
      );
    })
  ));

  
  deleteAnalysisReport$ = createEffect(() => this.actions$.pipe(
    ofType<DeleteAnalysisReport>(DELETE_ANALYSIS_REPORT_TYPES[0]),
    flatMap(action => {
      const type: ApiRequestTypes = 'delete';

      this.store.dispatch(new StartRequestAction(action, type));

      const url = `/pp/${this.proxyAPIVersion}/analysis/reports`;
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers,
        body: [action.guid]
      };

      return this.http.delete(url, requestArgs).pipe(
        mergeMap(() => {
          const res: NormalizedResponse = {
            entities: { [entityCatalog.getEntityKey(action)]: {} },
            result: []
          };
          this.appRef.tick();
          return [new WrapperRequestActionSuccess(res, action, type)];
        }),
        catchError(error => {
          this.appRef.tick();
          return [
            new WrapperRequestActionFailed(error.message, action, type, {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: error.status ? `${error.status}` : '500',
              message: 'Kubernetes Analysis Report request error',
              error
            })
          ];
        })
      );
    })
  ));

  
  runAnalysisReport$ = createEffect(() => this.actions$.pipe(
    ofType<RunAnalysisReport>(RUN_ANALYSIS_REPORT_TYPES[0]),
    flatMap(action => {
      const type: ApiRequestTypes = 'create';

      this.store.dispatch(new StartRequestAction(action, type));

      const { namespace, app } = action;
      const body = {
        namespace,
        app,
      };

      // Start an Analysis
      const url = `/pp/${this.proxyAPIVersion}/analysis/run/${action.guid}/${action.kubeGuid}`;
      const headers = new HttpHeaders({});
      const requestArgs = {
        headers,
      };

      return this.http.post(url, body, requestArgs).pipe(
        mergeMap((response: AnalysisReport) => {
          const res: NormalizedResponse = {
            entities: { [entityCatalog.getEntityKey(action)]: { [response.id]: response } },
            result: [response.id]
          };
          this.appRef.tick();
          return [new WrapperRequestActionSuccess(res, action, type)];
        }),
        catchError(error => {
          this.appRef.tick();
          return [
            new WrapperRequestActionFailed(error.message, action, type, {
              endpointIds: [action.kubeGuid],
              url: error.url || url,
              eventCode: error.status ? `${error.status}` : '500',
              message: 'Kubernetes Analysis Report request error',
              error
            })
          ];
        })
      );

    })
  ));


  private processReport(report: AnalysisReport): void {
    // Check the path of the report
    if (report.path.split('/').length !== 2) {
      return;
    }

    switch (report.format) {
      case 'popeye': {
        const helper = new PopeyeReportHelper(report as AnalysisReport & { report?: Record<string, unknown>; alerts?: Record<string, unknown> });
        helper.map();
        break;
      }
      case 'kubescore': {
        const kubeScoreHelper = new KubeScoreReportHelper(report as AnalysisReport & { report?: Record<string, unknown>; alerts?: Record<string, unknown> });
        kubeScoreHelper.map();
        break;
      }
      default:
        console.warn('Do not know how to handle this report type: ', report.format);
        break;
    }
  }
}
