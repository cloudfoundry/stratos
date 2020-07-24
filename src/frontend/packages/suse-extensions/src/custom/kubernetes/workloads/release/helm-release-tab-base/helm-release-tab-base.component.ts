import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, Subject, Subscription } from 'rxjs';
import makeWebSocketObservable, { GetWebSocketResponses } from 'rxjs-websockets';
import { catchError, map, share, switchMap } from 'rxjs/operators';

import { LoggerService } from '../../../../../../../core/src/core/logger.service';
import { IPageSideNavTab } from '../../../../../../../core/src/features/dashboard/page-side-nav/page-side-nav.component';
import { SessionService } from '../../../../../../../core/src/shared/services/session.service';
import { SnackBarService } from '../../../../../../../core/src/shared/services/snackbar.service';
import { AppState } from '../../../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../../../store/src/entity-catalog/entity-catalog';
import { EntityRequestAction, WrapperRequestActionSuccess } from '../../../../../../../store/src/types/request.types';
import { kubeEntityCatalog } from '../../../kubernetes-entity-catalog';
import { KubernetesPodExpandedStatusHelper } from '../../../services/kubernetes-expanded-state';
import { KubernetesAnalysisService } from '../../../services/kubernetes.analysis.service';
import { KubernetesPod, KubeService } from '../../../store/kube.types';
import { KubePaginationAction } from '../../../store/kubernetes.actions';
import { HelmReleaseGraph, HelmReleaseGuid, HelmReleasePod, HelmReleaseService } from '../../workload.types';
import { workloadsEntityCatalog } from '../../workloads-entity-catalog';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';


@Component({
  selector: 'app-helm-release-tab-base',
  templateUrl: './helm-release-tab-base.component.html',
  styleUrls: ['./helm-release-tab-base.component.scss'],
  providers: [
    HelmReleaseHelperService,
    KubernetesAnalysisService,
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

  public breadcrumbs = [{
    breadcrumbs: [
      { value: 'Workloads', routerLink: '/workloads' }
    ]
  }];

  public title = '';

  tabLinks: IPageSideNavTab[];

  constructor(
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
    private logService: LoggerService,
    private analysisService: KubernetesAnalysisService,
    private snackbarService: SnackBarService,
    sessionService: SessionService
  ) {
    this.title = this.helmReleaseHelper.releaseTitle;

    this.tabLinks = [
      { link: 'summary', label: 'Summary', icon: 'helm', iconFont: 'stratos-icons' },
      { link: 'notes', label: 'Notes', icon: 'subject' },
      { link: 'values', label: 'Values', icon: 'list' },
      { link: 'analysis', label: 'Analysis', icon: 'assignment', hidden$: this.analysisService.hideAnalysis$ },
      { link: '-', label: 'Resources' },
      { link: 'graph', label: 'Overview', icon: 'share', hidden$: sessionService.isTechPreview().pipe(map(tp => !tp)) },
      { link: 'pods', label: 'Pods', icon: 'pod', iconFont: 'stratos-icons' },
      { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' }
    ];

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
          const releasePodsAction = kubeEntityCatalog.pod.actions.getInWorkload(
            this.helmReleaseHelper.endpointGuid,
            this.helmReleaseHelper.releaseTitle
          );
          this.populateList(releasePodsAction, podsWithInfo);
        } else if (messageObj.kind === 'Graph') {
          const graph: HelmReleaseGraph = messageObj.data;
          graph.endpointId = this.helmReleaseHelper.endpointGuid;
          graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
          const releaseGraphAction = workloadsEntityCatalog.graph.actions.get(graph.releaseTitle, graph.endpointId);
          this.addResource(releaseGraphAction, graph);
        } else if (messageObj.kind === 'Manifest' || messageObj.kind === 'Resources') {
          // Store all of the services
          const manifest = messageObj.data;
          const svcs: KubeService[] = [];
          // Store ALL resources for the release
          manifest.forEach(resource => {
            if (resource.kind === 'Service' && prefix) {
              svcs.push(resource);
            }
          });
          if (svcs.length > 0) {
            const releaseServicesAction = kubeEntityCatalog.service.actions.getInWorkload(
              this.helmReleaseHelper.releaseTitle,
              this.helmReleaseHelper.endpointGuid,
            );
            this.populateList(releaseServicesAction, svcs);
          }

          // const resources = { ...manifest };
          // kind === 'Resources' is an array, really they should go into a pagination section
          messageObj.endpointId = this.helmReleaseHelper.endpointGuid;
          messageObj.releaseTitle = this.helmReleaseHelper.releaseTitle;

          const releaseResourceAction = workloadsEntityCatalog.resource.actions.get(
            this.helmReleaseHelper.releaseTitle,
            this.helmReleaseHelper.endpointGuid,
          );
          this.addResource(releaseResourceAction, messageObj);
        } else if (messageObj.kind === 'ManifestErrors') {
          if (messageObj.data) {
            this.snackbarService.show('Errors were found when parsing this workload. Not all resources may be shown', 'Dismiss');
          }
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

  private populateList(action: KubePaginationAction, resources: any) {
    const entity = entityCatalog.getEntity(action);
    const newResources = {};
    resources.forEach(resource => {
      const newResource: HelmReleasePod | HelmReleaseService = {
        endpointId: action.kubeGuid,
        releaseTitle: this.helmReleaseHelper.releaseTitle,
        ...resource
      };
      newResource.metadata.kubeId = action.kubeGuid;
      // The service entity from manifest is missing this, but apply here to ensure any others are caught
      newResource.metadata.namespace = this.helmReleaseHelper.namespace;
      const entityId = action.entity[0].getId(resource);
      newResources[entityId] = newResource;
    });

    const releasePods = {
      entities: { [entity.entityKey]: newResources },
      result: Object.keys(newResources)
    };
    const successWrapper = new WrapperRequestActionSuccess(releasePods, action, 'fetch', releasePods.result.length, 1);
    this.store.dispatch(successWrapper);
  }

  ngOnDestroy() {
    this.sub.unsubscribe();
    this.snackbarService.hide();
  }
}
