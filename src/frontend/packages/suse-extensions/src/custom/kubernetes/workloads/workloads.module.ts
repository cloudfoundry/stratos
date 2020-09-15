import { CommonModule, DatePipe } from '@angular/common';
import { NgModule } from '@angular/core';
import { MaterialDesignFrameworkModule } from '@cfstratos/ajsf-material';
import { NgxGraphModule } from '@swimlane/ngx-graph';
import { MonacoEditorModule, NgxMonacoEditorConfig } from 'ngx-monaco-editor';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../core/src/shared/shared.module';
import { KubernetesModule } from '../kubernetes.module';
import { ChartValuesEditorComponent } from './chart-values-editor/chart-values-editor.component';
import { CreateReleaseComponent } from './create-release/create-release.component';
import { HelmReleaseCardComponent } from './list-types/helm-release-card/helm-release-card.component';
import { HelmReleaseTabBaseComponent } from './release/helm-release-tab-base/helm-release-tab-base.component';
import {
  HelmReleaseAnalysisTabComponent,
} from './release/tabs/helm-release-analysis-tab/helm-release-analysis-tab.component';
import { HelmReleaseNotesTabComponent } from './release/tabs/helm-release-notes-tab/helm-release-notes-tab.component';
import { HelmReleasePodsTabComponent } from './release/tabs/helm-release-pods/helm-release-pods-tab.component';
import {
  HelmReleaseResourceGraphComponent,
} from './release/tabs/helm-release-resource-graph/helm-release-resource-graph.component';
import { HelmReleaseServicesTabComponent } from './release/tabs/helm-release-services/helm-release-services-tab.component';
import { HelmReleaseSummaryTabComponent } from './release/tabs/helm-release-summary-tab/helm-release-summary-tab.component';
import { HelmReleaseValuesTabComponent } from './release/tabs/helm-release-values-tab/helm-release-values-tab.component';
import { HelmReleasesTabComponent } from './releases-tab/releases-tab.component';
import { WorkloadsStoreModule } from './store/workloads.store.module';
import { UpgradeReleaseComponent } from './upgrade-release/upgrade-release.component';
import { WorkloadsRouting } from './workloads.routing';
import { HelmReleaseHistoryTabComponent } from './release/tabs/helm-release-history-tab/helm-release-history-tab.component';
import { WorkloadLiveReloadComponent } from './release/workload-live-reload/workload-live-reload.component';

// Default config for the Monaco edfior
const monacoConfig: NgxMonacoEditorConfig = {
  baseUrl: '/core/assets', // configure base path for monaco editor
  defaultOptions: { scrollBeyondLastLine: false }
};

@NgModule({
  imports: [
    CoreModule,
    CommonModule,
    SharedModule,
    WorkloadsStoreModule,
    WorkloadsRouting,
    NgxGraphModule,
    KubernetesModule,
    MaterialDesignFrameworkModule,
    MonacoEditorModule.forRoot(monacoConfig),
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
    HelmReleaseCardComponent,
    HelmReleaseAnalysisTabComponent,
    ChartValuesEditorComponent,
    CreateReleaseComponent,
    WorkloadLiveReloadComponent,
    UpgradeReleaseComponent,
    HelmReleaseHistoryTabComponent,
  ],
  entryComponents: [
    HelmReleaseCardComponent
  ],
  providers: [
    DatePipe
  ]
})
export class WorkloadsModule { }
