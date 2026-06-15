import { AsyncPipe, DatePipe, TitleCasePipe } from '@angular/common';
import { Portal, TemplatePortal } from '@angular/cdk/portal';
import {
  AfterViewInit,
  Component,
  ComponentRef,
  OnDestroy,
  TemplateRef,
  ViewChild,
  ViewContainerRef,
  inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { RouterLink } from '@angular/router';
import { formatDistance } from 'date-fns';
import { Observable, of } from 'rxjs';
import { take, filter, map, publishReplay, refCount, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../core/src/core/endpoints.service';
import { ConfirmationDialogConfig } from '../../../../core/src/shared/components/confirmation-dialog.config';
import { JsonViewerComponent } from '../../../../core/src/shared/components/json-viewer/json-viewer.component';
import { MetadataItemComponent } from '../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { SidepanelPreviewComponent } from '../../../../core/src/shared/components/sidepanel-preview/sidepanel-preview.component';
import { PreviewableComponent } from '../../../../core/src/shared/previewable-component';
import { SnackBarService } from '../../../../core/src/shared/services/snackbar.service';
import { EntityDeleteCleanupService } from '../../../../store/src/services/entity-delete-cleanup.service';
import { IFavoriteMetadata, UserFavorite } from '../../../../store/src/types/user-favorites.types';
import {
  KubeJobDataService, KubePersistentVolumeClaimDataService, KubeReplicaSetDataService,
  KubeRoleDataService, KubeSecretDataService, KubeServiceAccountDataService,
} from '../../services/domain-data/kube-generic-resource-data.services';
import { KubePodDataService } from '../../services/domain-data/kube-pod-data.service';
import { KubeServiceDataService } from '../../services/domain-data/kube-service-data.service';
import { KUBERNETES_ENDPOINT_TYPE } from '../kubernetes-entity-factory';
import { KubernetesEndpointService } from '../services/kubernetes-endpoint.service';
import { BasicKubeAPIResource, KubeAPIResource, KubeResourceEntityDefinition } from '../store/kube.types';
import { ConfirmationDialogService } from './../../../../core/src/shared/components/confirmation-dialog.service';
import { SidePanelService } from './../../../../core/src/shared/services/side-panel.service';
import { entityCatalog } from './../../../../store/src/entity-catalog/entity-catalog';
import { UserFavoriteManager } from './../../../../store/src/user-favorite-manager';

export interface KubernetesResourceViewerComponentConfig {
  endpointId?: string;
  resource: BasicKubeAPIResource;
  definition?: KubeResourceEntityDefinition;
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
  labels: { name: string, value: string }[];
  annotations: { name: string, value: string }[];
  kind: string;
  apiVersion: string;
}

@Component({
selector: 'app-kubernetes-resource-viewer',
  templateUrl: './kubernetes-resource-viewer.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    DatePipe,
    TitleCasePipe,
    RouterLink,
    SidepanelPreviewComponent,
    MetadataItemComponent,
    JsonViewerComponent,
  ]
})
export class KubernetesResourceViewerComponent implements PreviewableComponent, OnDestroy, AfterViewInit {
  private endpointsService = inject(EndpointsService);
  private kubeEndpointService = inject(KubernetesEndpointService);
  private userFavoriteManager = inject(UserFavoriteManager);
  private viewContainerRef = inject(ViewContainerRef);
  private confirmDialog = inject(ConfirmationDialogService);
  private sidePanelService = inject(SidePanelService);
  private snackBarService = inject(SnackBarService);
  private cdr = inject(ChangeDetectorRef);

  // Signal-native delete: resolve the resource's data service by catalog type
  // and route favorites/recents cleanup through the shared store helper.
  private deleteCleanup = inject(EntityDeleteCleanupService);
  private deleteServices: Record<string, { delete: (kubeGuid: string, name: string, namespace?: string) => Promise<void> }> = {
    pod: inject(KubePodDataService),
    service: inject(KubeServiceDataService),
    job: inject(KubeJobDataService),
    secrets: inject(KubeSecretDataService),
    pvc: inject(KubePersistentVolumeClaimDataService),
    replicaSet: inject(KubeReplicaSetDataService),
    role: inject(KubeRoleDataService),
    serviceAccount: inject(KubeServiceAccountDataService),
  };

  // strict: the following are assigned by setProps, the previewable-component
  // entry point the framework invokes before the template renders them.
  public title!: string;
  public resource$!: Observable<KubernetesResourceViewerResource>;

  public hasPodMetrics$!: Observable<boolean>;
  public podRouterLink$!: Observable<string[]>;

  private analysis: any;
  public alerts: any;

  public favorite?: UserFavorite<IFavoriteMetadata>;

  // Custom component
  @ViewChild('customComponent', { read: ViewContainerRef, static: false }) customComponentContainer: ViewContainerRef | undefined;
  componentRef: ComponentRef<PreviewableComponent> | undefined;

  component: any;

  data!: KubernetesResourceViewerComponentConfig; // strict: assigned in setProps before deleteWarn can fire

  // strict: static:false ViewChild resolved by ngAfterViewInit, where headerContent is built
  @ViewChild('header', { static: false }) templatePortalContent!: TemplateRef<unknown>;
  headerContent!: Portal<any>;

  ngOnDestroy(): void {
    this.removeCustomComponent();
  }

  removeCustomComponent(): void {
    if (this.customComponentContainer) {
      this.customComponentContainer.clear();
    }
    if (this.componentRef) {
      this.componentRef.destroy();
    }
  }

  createCustomComponent(): void {
    this.removeCustomComponent();
    if (this.component && this.customComponentContainer) {
      this.componentRef = this.customComponentContainer.createComponent(this.component);
      this.componentRef.instance.setProps(this.data);
    }
  }

  ngAfterViewInit(): void {
    this.createCustomComponent();
    setTimeout(() => this.headerContent = new TemplatePortal(this.templatePortalContent, this.viewContainerRef), 0);
  }

  setProps(props: KubernetesResourceViewerConfig): void {
    this.title = props.title;
    this.analysis = props.analysis;
    this.component = props.component;

    this.resource$ = props.resource$.pipe(
      filter(item => !!item),
      map((item: BasicKubeAPIResource) => {
        const resource: KubernetesResourceViewerResource = {} as KubernetesResourceViewerResource;
        const newItem: Record<string, any> = {};
        const itemWithDynamicProps = item as Record<string, any>;

        resource.raw = item;
        Object.keys(item || {}).forEach((k: string) => {
          if (k !== 'endpointId' && k !== 'releaseTitle' && k !== 'expandedStatus' && k !== '_metadata') {
            newItem[k] = itemWithDynamicProps[k];
          }
        });

        resource.jsonView = newItem as KubeAPIResource;

        const fallback = itemWithDynamicProps['_metadata'] || {};

        const ts = item.metadata ? item.metadata.creationTimestamp : fallback.creationTimestamp;
        resource.age = formatDistance(new Date(ts), new Date());
        resource.creationTimestamp = ts;

        if (item.metadata && item.metadata.labels) {
          const labels = item.metadata.labels;
          resource.labels = [];
          Object.keys(labels).forEach(labelName => {
            resource.labels.push({
              name: labelName,
              value: labels[labelName]
            });
          });
        }

        if (item.metadata && item.metadata.annotations) {
          const annotations = item.metadata.annotations;
          resource.annotations = [];
          Object.keys(annotations).forEach(labelName => {
            resource.annotations.push({
              name: labelName,
              value: annotations[labelName]
            });
          });
        }

        resource.kind = itemWithDynamicProps['kind'] || fallback.kind || props.resourceKind;
        const metadataWithSelfLink = item.metadata as Record<string, any>;
        resource.apiVersion = itemWithDynamicProps['apiVersion'] || fallback.apiVersion || this.getVersionFromSelfLink(metadataWithSelfLink['selfLink']);

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
        switchMap(resource => {
          const endpointId = this.getEndpointId(resource.raw);
          return endpointId ? this.endpointsService.hasMetrics(endpointId) : of(false);
        }),
        take(1),
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
    this.createCustomComponent();
    this.cdr.markForCheck();
  }

  private getVersionFromSelfLink(url: string): string | undefined {
    if (!url) {
      return undefined;
    }
    const parts = url.split('/');
    return `${parts[1]}/${parts[2]}`;
  }

  private getEndpointId(res: { endpointId?: string; metadata?: { kubeId?: string } }): string | undefined {
    return this.kubeEndpointService?.kubeGuid || res.endpointId || res.metadata?.kubeId;
  }

  private applyAnalysis(resource: KubernetesResourceViewerResource): void {
    let id = (resource.kind || 'pod').toLowerCase();
    id = `${id}/${resource.raw.metadata.namespace}/${resource.raw.metadata.name}`;
    if (this.analysis && this.analysis.alerts[id]) {
      this.alerts = this.analysis.alerts[id];
    } else {
      this.alerts = null;
    }
  }

  private setFavorite(defn: KubeResourceEntityDefinition, item: BasicKubeAPIResource): void {
    if (defn) {
      const entityDefn = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, defn.type);
      const canFav = this.userFavoriteManager.canFavoriteEntityType(entityDefn);
      if (canFav) {
        this.favorite = this.userFavoriteManager.getFavorite(item, defn.type, KUBERNETES_ENDPOINT_TYPE) ?? undefined;
      }
    }
  }

  // Warn about deletion and then delete the resource if confirmed
  public deleteWarn(): void {
    // Namespace vs Pod definition in different places
    const defnRaw = this.data.definition as any;
    const defn = (defnRaw?.definition || this.data.definition) as KubeResourceEntityDefinition;
    this.sidePanelService.hide();
    const confirmation = new ConfirmationDialogConfig(
      `Delete ${defn.label}`,
      `Are you sure you want to delete "${this.data.resource.metadata.name}" ?`,
      'Delete',
      true,
    );
    this.confirmDialog.openWithCancel(confirmation,
      () => {
        const name = this.data.resource.metadata.name;
        const namespace = this.data.resource.metadata.namespace;
        const dataService = this.deleteServices[defn.type];
        if (!dataService) {
          this.snackBarService.show(`Delete not supported for ${defn.label}`);
          return;
        }
        const endpointId = this.data.endpointId;
        if (!endpointId) {
          this.snackBarService.show(`Could not delete resource: missing endpoint`);
          return;
        }
        // Signal-native delete (replaces the ngrx deleteResource pipeline).
        // On success drop the favorite/recent the legacy EntityDeleteComplete
        // path used to clean up, then surface the same snackbar.
        dataService.delete(endpointId, name, namespace)
          .then(() => {
            if (this.favorite && this.favorite.entityId) {
              this.deleteCleanup.removeFavoriteAndRecent(
                this.favorite.endpointId,
                this.favorite.endpointType,
                this.favorite.entityType,
                this.favorite.entityId,
              );
            }
            this.snackBarService.show(`Deleted resource '${name}'`);
          })
          .catch((err: unknown) => {
            this.snackBarService.show(`Could not delete resource: ${(err as Error)?.message ?? String(err)}`);
          });
      },
      () => {
        this.sidePanelService.open();
      }
    );
  }
}
