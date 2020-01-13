import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { NgxGraphModule } from '@swimlane/ngx-graph';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { HelmReleaseServiceCardComponent } from './list-types/helm-release-service-card/helm-release-service-card.component';
import { HelmServicePortsComponent } from './list-types/helm-service-ports/helm-service-ports.component';
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
  ],
  declarations: [
    HelmReleasesTabComponent,
    HelmReleaseServiceCardComponent,
    HelmReleaseTabBaseComponent,
    HelmReleaseSummaryTabComponent,
    HelmReleaseNotesTabComponent,
    HelmReleaseValuesTabComponent,
    HelmReleasePodsTabComponent,
    HelmReleaseServicesTabComponent,
    HelmReleaseResourceGraphComponent,
    HelmReleaseResourcePreviewComponent,
    HelmServicePortsComponent
  ],
  entryComponents: [
    HelmReleaseServiceCardComponent,
    HelmServicePortsComponent,
    HelmReleaseResourcePreviewComponent,
  ]
})
export class WorkloadsModule { }
