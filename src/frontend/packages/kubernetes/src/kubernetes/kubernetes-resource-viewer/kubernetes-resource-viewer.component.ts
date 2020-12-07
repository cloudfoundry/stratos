import { Portal, TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnDestroy,
  OnInit,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import moment from 'moment';
import { Observable, of } from 'rxjs';
import { filter, first, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { PreviewableComponent } from '../../../../core/src/shared/previewable-component';
import { StratosCatalogEntity } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog-entity';
import { IFavoriteMetadata, UserFavorite } from '../../../../store/src/types/user-favorites.types';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { KubeResourceActionBuilders } from '../store/action-builders/kube-resource.action-builder';
import { BasicKubeAPIResource, KubeAPIResource, KubeResourceEntityDefinition, KubeStatus } from '../store/kube.types';
import { ConfirmationDialogService } from './../../../../core/src/shared/components/confirmation-dialog.service';
import { SidePanelService } from './../../../../core/src/shared/services/side-panel.service';
import { entityCatalog } from './../../../../store/src/entity-catalog/entity-catalog';
import { UserFavoriteManager } from './../../../../store/src/user-favorite-manager';

export interface KubernetesResourceViewerComponentConfig {
  resource: BasicKubeAPIResource;
}

export interface KubernetesResourceViewerConfig {
  title: string;
  analysis?: any;
  resource$: Observable<BasicKubeAPIResource>;
  resourceKind: string;
  component?: any;
  definition?: any;
}

interface KubernetesResourceViewerResource {
  raw: any;
  jsonView: KubeAPIResource;
  age: string;
  creationTimestamp: string;
  labels: { name: string, value: string, }[];
  annotations: { name: string, value: string, }[];
  kind: string;
  apiVersion: string;
}

@Component({
  selector: 'app-kubernetes-resource-viewer',
  templateUrl: './kubernetes-resource-viewer.component.html',
  styleUrls: ['./kubernetes-resource-viewer.component.scss']
})
export class KubernetesResourceViewerComponent implements PreviewableComponent, OnDestroy, OnInit, AfterViewInit {

  constructor(
    private endpointsService: EndpointsService,
    private kubeEndpointService: KubernetesEndpointService,
    private resolver: ComponentFactoryResolver,
    private userFavoriteManager: UserFavoriteManager,
    private viewContainerRef: ViewContainerRef,
    private confirmDialog: ConfirmationDialogService,
    private sidePanelService: SidePanelService,
  ) { }

  public title: string;
  public resource$: Observable<KubernetesResourceViewerResource>;

  public hasPodMetrics$: Observable<boolean>;
  public podRouterLink$: Observable<string[]>;

  private analysis;
  public alerts;

  public favorite: UserFavorite<IFavoriteMetadata>;

  // Custom component
  @ViewChild('customComponent', { read: ViewContainerRef, static: false }) customComponentContainer;
  componentRef: ComponentRef<PreviewableComponent>;

  component: any;

  data: any;

  @ViewChild('header', {static: false}) templatePortalContent: TemplateRef<unknown>;
  headerContent: Portal<any>;

  ngOnInit() {
    this.createCustomComponent();
  }

  ngOnDestroy() {
    this.removeCustomComponent();
  }

  removeCustomComponent() {
    if (this.customComponentContainer) {
      this.customComponentContainer.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  createCustomComponent() {
    this.removeCustomComponent();
    if (this.component && this.customComponentContainer) {
      const factory: ComponentFactory<any> = this.resolver.resolveComponentFactory(this.component);
      this.componentRef = this.customComponentContainer.createComponent(factory);
      this.componentRef.instance.setProps(this.data);
    }
  }

  ngAfterViewInit() {
    setTimeout(() => this.headerContent = new TemplatePortal(this.templatePortalContent, this.viewContainerRef), 0);
  }

  setProps(props: KubernetesResourceViewerConfig) {
    this.title = props.title;
    this.analysis = props.analysis;
    this.resource$ = props.resource$.pipe(
      filter(item => !!item),
      map((item: (KubeAPIResource | KubeStatus)) => {
        const resource: KubernetesResourceViewerResource = {} as KubernetesResourceViewerResource;
        const newItem = {} as any;

        resource.raw = item;
        Object.keys(item || []).forEach(k => {
          if (k !== 'endpointId' && k !== 'releaseTitle' && k !== 'expandedStatus' && k !== '_metadata') {
            newItem[k] = item[k];
          }
        });

        resource.jsonView = newItem;

        /* tslint:disable-next-line:no-string-literal  */
        const fallback = item['_metadata'] || {};

        const ts = item.metadata ? item.metadata.creationTimestamp : fallback.creationTimestamp;
        resource.age = moment(ts).fromNow(true);
        resource.creationTimestamp = ts;

        if (item.metadata && item.metadata.labels) {
          resource.labels = [];
          Object.keys(item.metadata.labels || []).forEach(labelName => {
            resource.labels.push({
              name: labelName,
              value: item.metadata.labels[labelName]
            });
          });
        }

        if (item.metadata && item.metadata.annotations) {
          resource.annotations = [];
          Object.keys(item.metadata.annotations || []).forEach(labelName => {
            resource.annotations.push({
              name: labelName,
              value: item.metadata.annotations[labelName]
            });
          });
        }

        /* tslint:disable-next-line:no-string-literal  */
        resource.kind = item['kind'] || fallback.kind || props.resourceKind;
        /* tslint:disable-next-line:no-string-literal  */
        resource.apiVersion = item['apiVersion'] || fallback.apiVersion || this.getVersionFromSelfLink(item.metadata['selfLink']);

        this.component = props.component;
        this.data = {
          endpointId: this.getEndpointId(item),
          resource: item,
          definition: props.definition
        };
        this.createCustomComponent();

        setTimeout(() => this.setFavorite(props.definition, item), 0);

        // Apply analysis if there is one - if this is a k8s resource (i.e. not a container)
        if (item.metadata) {
          this.applyAnalysis(resource);
        }
        return resource;
      }),
      publishReplay(1),
      refCount()
    );

    this.hasPodMetrics$ = props.resourceKind === 'pod' ?
      this.resource$.pipe(
        switchMap(resource => this.endpointsService.hasMetrics(this.getEndpointId(resource.raw))),
        first(),
      ) :
      of(false);

    this.podRouterLink$ = this.hasPodMetrics$.pipe(
      filter(hasPodMetrics => hasPodMetrics),
      switchMap(() => this.resource$),
      map(pod => {
        return [
          `/kubernetes`,
          this.getEndpointId(pod.raw),
          `pods`,
          pod.raw.metadata.namespace,
          pod.raw.metadata.name
        ];
      })
    );
  }

  private getVersionFromSelfLink(url: string): string {
    if (!url) {
      return;
    }
    const parts = url.split('/');
    return `${parts[1]}/${parts[2]}`;
  }

  private getEndpointId(res): string {
    return this.kubeEndpointService?.kubeGuid || res.endpointId || res.metadata?.kubeId;
  }

  private applyAnalysis(resource) {
    let id = (resource.kind || 'pod').toLowerCase();
    id = `${id}/${resource.raw.metadata.namespace}/${resource.raw.metadata.name}`;
    if (this.analysis && this.analysis.alerts[id]) {
      this.alerts = this.analysis.alerts[id];
    } else {
      this.alerts = null;
    }
  }

  private setFavorite(defn: KubeResourceEntityDefinition, item: any) {
    if (defn) {
      const entityDefn = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, defn.type);
      const canFav = this.userFavoriteManager.canFavoriteEntityType(entityDefn);
      if (canFav) {
        this.favorite = this.userFavoriteManager.getFavorite(item, defn.type, KUBERNETES_ENDPOINT_TYPE);
      }
    }
  }

  // Warn about deletion and then delete the resource if confirmed
  public deleteWarn() {
    const defn = this.data.definition as KubeResourceEntityDefinition;
    this.sidePanelService.hide();
    const confirmation = new ConfirmationDialogConfig(
      `Delete ${defn.label}`,
      `Are you sure you want to delete "${this.data.resource.metadata.name}" ?`,
      'Delete',
      true,
    );
    this.confirmDialog.openWithCancel(confirmation,
      () => {
        // TODO: Subscribe only until done
        const catalogEntity = entityCatalog.getEntityFromKey(entityCatalog.getEntityKey(KUBERNETES_ENDPOINT_TYPE, defn.type)) as
          StratosCatalogEntity<IFavoriteMetadata, any, KubeResourceActionBuilders>;
        catalogEntity.api.deleteResource(
          this.data.resource.metadata.name,
          this.data.endpointId,
          this.data.resource.metadata.namespace
        ).subscribe(a => {
          console.log('delete progress');
          console.log(a);
        });
      },
      () => {
        this.sidePanelService.open();
      }
    );
  }
}
