import { HELM_ENDPOINT_TYPE } from './../../helm-entity-factory';
import { GetHelmReleaseServices } from './../../store/helm.actions';
import { entityCatalogue } from './../../../../core/entity-catalogue/entity-catalogue.service';
import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable, Subject, Subscription } from 'rxjs';

import { HelmReleaseGuid, HelmReleasePod } from '../../store/helm.types';
import { HelmReleaseHelperService } from '../tabs/helm-release-helper.service';
import { catchError } from 'rxjs/operators';
import websocketConnect, { Connection } from 'rxjs-websockets';
import { Store, Action } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import {
  successEntityHandler
} from '../../../../../../store/src/entity-request-pipeline/entity-request-base-handlers/success-entity-request.handler';
import {
  KUBERNETES_ENDPOINT_TYPE,
  kubernetesPodsEntityType,
  kubernetesServicesEntityType
} from '../../../kubernetes/kubernetes-entity-factory';
import { PipelineResult } from '../../../../../../store/src/entity-request-pipeline/entity-request-pipeline.types';
import { GetHelmReleasePods } from '../../store/helm.actions';
import { EntityCatalogueEntityConfig } from '../../../../core/entity-catalogue/entity-catalogue.types';
import { helmReleaseGraphEntityType } from '../../helm-entity-factory';

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

  private connection: Connection;

  public breadcrumbs = [{
    breadcrumbs: [
      { value: 'Helm', routerLink: '/monocular' },
      { value: 'Releases', routerLink: '/monocular/releases' }
    ]
  }];

  public title = '';

  tabLinks = [
    { link: 'summary', label: 'Summary', icon: 'helm', iconFont: 'stratos-icons' },
    { link: 'notes', label: 'Notes', icon: 'subject' },
    { link: 'values', label: 'Values', icon: 'list' },
    { link: '-', label: 'Resources' },
    { link: 'graph', label: 'Overview', icon: 'share' },
    { link: 'pods', label: 'Pods', icon: 'adjust' },
    { link: 'services', label: 'Services', icon: 'service', iconFont: 'stratos-icons' }
  ];
  constructor(
    private helmRelease: HelmReleaseGuid,
    public helmReleaseHelper: HelmReleaseHelperService,
    private store: Store<AppState>,
  ) {
    const guid = this.helmRelease.guid;
    this.title = guid.split(':')[1];

    console.log('RELEASE BASE - CREATE NEW');

    const endpointAndName = this.helmReleaseHelper.guid.replace(':', '/');
    const host = window.location.host;
    const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws';
    const streamUrl = (
      `${protocol}://${host}/pp/v1/helm/releases/${endpointAndName}`
    );
    console.log(streamUrl);

    const data = new Subject<string>();
    const connection = websocketConnect(
      streamUrl,
      data
    );

    const messages = connection.messages.pipe(
      catchError(e => {
        console.log('WS Erorr');
        console.log(e);
        if (e.type === 'error') {
          console.log(e);
        }
        return [];
      }));

    let prefix = '';
    this.sub = messages.subscribe(jsonString => {
      console.log('Got message ....');

      const messageObj = JSON.parse(jsonString);
      if (messageObj) {
        console.log(messageObj);

        // this.store.dispatch(new HelmUpdateRelease(messageObj));

        if (messageObj.kind === 'ReleasePrefix') {
          prefix = messageObj.data;
          console.log('Got prefix: ' + prefix);
        } else if (messageObj.kind === 'Pods') {
          const pods = messageObj.data;
          pods.forEach(pod => {
            this.addResource(kubernetesPodsEntityType, pod, pod.metadata.uid);
          });
          const releasePodsAction = new GetHelmReleasePods(this.helmReleaseHelper.endpointGuid, this.helmReleaseHelper.releaseTitle);
          this.populateList(releasePodsAction, pods);
        } else if (messageObj.kind === 'Graph') {
          console.log('GOT GRAPH');
          const graph = messageObj.data;
          graph.endpointId = this.helmReleaseHelper.endpointGuid;
          graph.releaseTitle = this.helmReleaseHelper.releaseTitle;
          console.log(graph);
          this.addResource(helmReleaseGraphEntityType, graph, prefix, HELM_ENDPOINT_TYPE);
        } else if (messageObj.kind === 'Manifest' ||  messageObj.kind === 'Resources') {
          // Store all of the services
          const manifest = messageObj.data;
          const ep = this.helmReleaseHelper.endpointGuid;
          const releaseServicesAction = new GetHelmReleaseServices(
            this.helmReleaseHelper.endpointGuid,
            this.helmReleaseHelper.releaseTitle
          );
          const svcs = [];

          manifest.forEach(resource => {
            if (resource.kind === 'Service' && prefix) {
              console.log(`Service: ${prefix}-${resource.metadata.name}`);
              this.addResource(kubernetesServicesEntityType, resource, `${prefix}-${resource.metadata.name}`);
              svcs.push(resource);
            }
          });
          if (svcs.length > 0) {
            this.populateList(releaseServicesAction, svcs, (svc) => `${prefix}-${svc.metadata.name}`);
          }
        }
      }
    });
  }

  private addResource(entityType: string, data: any, id: string, endpointType = KUBERNETES_ENDPOINT_TYPE) {
    const actionDispatcher = (action) => this.store.dispatch(action);
    const catalogEntity = entityCatalogue.getEntity(endpointType, entityType);
    const pr = {
      success: true,
      response: {
        entities: {
          [catalogEntity.entityKey]: {
            [id]: data
          }
        },
        result: [
          id
        ]
      }
    } as PipelineResult;
    successEntityHandler(
      actionDispatcher,
      catalogEntity,
      'get',
      {
        endpointType,
        entityType,
        guid: id
      },
      pr
    );
  }

  private populateList(action: EntityCatalogueEntityConfig, resources: any, idGetter?: IDGetterFunction) {
    const entityType = kubernetesPodsEntityType;
    const releaseTitle = this.helmReleaseHelper.releaseTitle;
    const endpointId = this.helmReleaseHelper.endpointGuid;

    if (!idGetter) {
      idGetter = (data) => data.metadata.uid;
    }

    const actionDispatcher = (a) => this.store.dispatch(a);
    const catalogEntity = entityCatalogue.getEntity(KUBERNETES_ENDPOINT_TYPE, entityType);
    const newResources = {};
    resources.forEach(resource => {
      const newResource: HelmReleasePod = {
        endpointId,
        releaseTitle,
        ...resource
      };
      newResources[idGetter(resource)] = newResource;
    });

    const releasePods = {
      success: true,
      response: {
        entities: { [entityCatalogue.getEntityKey(action)]: Object.values(newResources) },
        result: Object.keys(newResources)
      }
    };

    successEntityHandler(
      actionDispatcher,
      catalogEntity,
      'get',
      action,
      releasePods,
    );
  }

  ngOnDestroy() {
    console.log('DESTROY RELEASE TAB BASE');
    this.sub.unsubscribe();
  }
}
