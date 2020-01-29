import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { LoggerService } from 'frontend/packages/core/src/core/logger.service';
import { IPageSideNavTab } from 'frontend/packages/core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { AppState } from 'frontend/packages/store/src/app-state';
import { entityCatalog } from 'frontend/packages/store/src/entity-catalog/entity-catalog.service';
import { PaginatedAction } from 'frontend/packages/store/src/types/pagination.types';
import { EntityRequestAction, WrapperRequestActionSuccess } from 'frontend/packages/store/src/types/request.types';
import { Observable, Subject, Subscription } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, map, share, switchMap } from 'rxjs/operators';

import { KubernetesPodExpandedStatusHelper } from '../../../services/kubernetes-expanded-state';
import { getKubeAPIResourceGuid } from '../../../store/kube.selectors';
import { KubernetesPod } from '../../../store/kube.types';
import { getHelmReleaseServiceId } from '../../store/workloads-entity-factory';
import {
  GetHelmReleaseGraph,
  GetHelmReleasePods,
  GetHelmReleaseResource,
  GetHelmReleaseServices,
} from '../../store/workloads.actions';
import { HelmReleaseGraph, HelmReleaseGuid, HelmReleasePod } from '../../workload.types';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';

type IDGetterFunction = (data: any) => string;



@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    HelmReleaseHelperService,
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => ({
        guid: activatedRoute.snapshot.params.guid
      }),
      deps: [
        ActivatedRoute
      ]
    }
  ]
})
export class HelmReleaseTabBaseComponent implements OnDestroy {

  isFetching$: Observable<boolean>;

  private sub: Subscription;

  // private connection: Connection;

  public breadcrumbs = [{
    breadcrumbs: [
      { value: 'Workloads', routerLink: '/workloads' }
    ]
  }];

  public title = '';

  tabLinks: IPageSideNavTab[] = [
    { link: 'summary', label: 'Summary', icon: 'helm', iconFont: 'stratos-icons' },
    { link: 'notes', label: 'Notes', icon: 'subject' },
    { link: 'values', label: 'Values', icon: 'list' },
    { link: '-', label: 'Resources' },
    // { link: 'graph', label: 'Overview', icon: 'share' },
    { link: 'pods', label: 'Pods', icon: 'adjust' },
    { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' }
  ];
  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private logService: LoggerService
  ) {
    this.title = this.helmReleaseHelper.releaseTitle;


    const releaseRef = this.helmReleaseHelper.guidAsUrlFragment();
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const streamUrl = (
      `${protocol}://${host}/pp/v1/helm/releases/${releaseRef}/status`
    );

    const socket$ = makeWebSocketObservable(streamUrl).pipe(catchError(e => {
      this.logService.error(
        'Error while connecting to socket: ' + JSON.stringify(e)
      );
      return [];
    }),
      share(),
    );

    const messages = socket$.pipe(
      switchMap((getResponses: GetWebSocketResponses) => {
        return getResponses(new Subject<string>());
      }),
      map((message: string) => message),
      catchError(e => {
        console.error('Workload WS error: ', e);
        return [];
      })
    );

    let prefix = '';
    this.sub = messages.subscribe(jsonString => {
      const messageObj = JSON.parse(jsonString);
      if (messageObj) {
        if (messageObj.kind === 'ReleasePrefix') {
          prefix = messageObj.data;
        } else if (messageObj.kind === 'Pods') {
          const pods: KubernetesPod[] = messageObj.data || [];
          const podsWithInfo: KubernetesPod[] = pods.map(pod => KubernetesPodExpandedStatusHelper.updatePodWithExpandedStatus(pod));
          const releasePodsAction = new GetHelmReleasePods(this.helmReleaseHelper.endpointGuid, this.helmReleaseHelper.releaseTitle);
          this.populateList(releasePodsAction, podsWithInfo, getKubeAPIResourceGuid);
        } else if (messageObj.kind === 'Graph') {
          const graph: HelmReleaseGraph = messageObj.data;
          graph.endpointId = this.helmReleaseHelper.endpointGuid;
          graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
          const releaseGraphAction = new GetHelmReleaseGraph(graph.endpointId, graph.releaseTitle);

          this.addResource(releaseGraphAction, graph);
        } else if (messageObj.kind === 'Manifest' || messageObj.kind === 'Resources') {
          // Store all of the services
          const manifest = messageObj.data;
          const svcs = [];
          // Store ALL resources for the release
          manifest.forEach(resource => {
            if (resource.kind === 'Service' && prefix) {
              svcs.push(resource);
            }
          });
          if (svcs.length > 0) {
            const releaseServicesAction = new GetHelmReleaseServices(
              this.helmReleaseHelper.endpointGuid,
              this.helmReleaseHelper.releaseTitle
            );
            this.populateList(releaseServicesAction, svcs, getHelmReleaseServiceId);
          }

          const resources = { ...manifest };
          resources.endpointId = this.helmReleaseHelper.endpointGuid;
          resources.releaseTitle = this.helmReleaseHelper.releaseTitle;
          const releaseResourceAction = new GetHelmReleaseResource(resources.endpointId, resources.releaseTitle);
          this.addResource(releaseResourceAction, resources);
        }
      }
    });
  }

  private addResource(action: EntityRequestAction, data: any) {
    const catalogEntity = entityCatalog.getEntity(action);
    const response = {
      entities: {
        [catalogEntity.entityKey]: {
          [action.guid]: data
        }
      },
      result: [
        action.guid
      ]
    };
    const successWrapper = new WrapperRequestActionSuccess(response, action);
    this.store.dispatch(successWrapper);
  }

  private populateList(action: PaginatedAction, resources: any, idGetter: IDGetterFunction) {
    const newResources = {};
    resources.forEach(resource => {
      const newResource: HelmReleasePod = {
        endpointId: action.endpointGuid,
        releaseTitle: this.helmReleaseHelper.releaseTitle,
        ...resource
      };
      newResources[idGetter(newResource)] = newResource;
    });

    const releasePods = {
      entities: { [entityCatalog.getEntityKey(action)]: newResources },
      result: Object.keys(newResources)
    };
    const successWrapper = new WrapperRequestActionSuccess(releasePods, action, 'fetch', releasePods.result.length, 1);
    this.store.dispatch(successWrapper);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
  }
}
