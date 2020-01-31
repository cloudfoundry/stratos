import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { KubernetesModule } from '../kubernetes.module';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { HelmReleasePodsTabComponent } from './release/tabs/helm-release-pods/helm-release-pods-tab.component';
import {
  HelmReleaseResourceGraphComponent,
} from './release/tabs/helm-release-resource-graph/helm-release-resource-graph.component';
import {
  HelmReleaseResourcePreviewComponent,
} from './release/tabs/helm-release-resource-graph/helm-release-resource-preview/helm-release-resource-preview.component';
import { HelmReleaseServicesTabComponent } from './release/tabs/helm-release-services/helm-release-services-tab.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';
import { HelmReleasesTabComponent } from './releases-tab/releases-tab.component';
import { WorkloadsStoreModule } from './store/workloads.store.module';
import { WorkloadsRouting } from './workloads.routing';

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    WorkloadsStoreModule,
    WorkloadsRouting,
    NgxGraphModule,
    KubernetesModule
  ],
  declarations: [
    HelmReleasesTabComponent,
    HelmReleaseTabBaseComponent,
    HelmReleaseSummaryTabComponent,
    HelmReleaseNotesTabComponent,
    HelmReleaseValuesTabComponent,
    HelmReleasePodsTabComponent,
    HelmReleaseServicesTabComponent,
    HelmReleaseResourceGraphComponent,
    HelmReleaseResourcePreviewComponent,
  ],
  entryComponents: [
    HelmReleaseResourcePreviewComponent,
  ]
})
export class WorkloadsModule { }
