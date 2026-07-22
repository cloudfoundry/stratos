import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  ViewChild,
  WritableSignal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { format, formatDistance } from 'date-fns';
import { combineLatest, firstValueFrom, Observable } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import {
  SignalListComponent,
  SignalListConfig,
  SignalListDropdownOption,
} from '../../../../../core/src/shared/components/signal-list/signal-list.component';
import {
  SignalStepHandle,
  StepComponent,
} from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { createMonocularProviders } from '../../../helm/monocular/stratos-monocular-providers.helpers';
import { stratosMonocularEndpointGuid } from '../../../helm/monocular/stratos-monocular.helper';
import { MonocularVersion } from '../../../helm/store/helm.types';
import { KubeHelmDataService } from '../../../services/endpoint-data/kube-helm-data.service';
import { HelmUpgradePayload } from '../../../services/endpoint-data/kube-types';
import { ChartValuesConfig, ChartValuesEditorComponent } from '../chart-values-editor/chart-values-editor.component';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleaseGuid } from '../workload.types';
import { HelmReleaseVersionsSignalConfigService } from './helm-release-versions-signal-config.service';

@Component({
  selector: 'app-upgrade-release',
  templateUrl: './upgrade-release.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ChartValuesEditorComponent,
    PageHeaderComponent,
    SignalListComponent,
    StepComponent,
    SteppersComponent
  ],
  providers: [
    HelmReleaseHelperService,
    HelmReleaseVersionsSignalConfigService,
    {
      provide: HelmReleaseGuid,
      useFactory: (activatedRoute: ActivatedRoute) => ({
        guid: activatedRoute.snapshot.params.guid
      }),
      deps: [
        ActivatedRoute
      ]
    },
    ...createMonocularProviders()
  ]
})
export class UpgradeReleaseComponent {

  @ViewChild('editor', { static: true }) editor!: ChartValuesEditorComponent; // strict: @ViewChild populated by Angular

  public cancelUrl;
  // Signal-native list config for the version picker; undefined until the
  // upgrade target chart resolves (hasUpgrade emits).
  public readonly listConfig: WritableSignal<SignalListConfig<MonocularVersion> | undefined> = signal(undefined);
  private version!: MonocularVersion; // strict: set by the version step's submit() before the overrides step reads it

  public config!: ChartValuesConfig; // strict: assigned by fetchVersionDetails$ before the editor renders

  private monocularEndpointId!: string; // strict: assigned in the hasUpgrade subscription before submit reads it

  // Future
  public showAdvancedOptions = false;

  private chartUrl!: string; // strict: assigned by fetchVersionDetails$ before doUpgrade$ reads it
  public helper = inject(HelmReleaseHelperService);
  private chartsService = inject(ChartsService);
  private router = inject(Router);
  private helmDataService = inject(KubeHelmDataService);
  private readonly versionsConfig = inject(HelmReleaseVersionsSignalConfigService);

  // FWT-959 Part 2: signal-native step handles.
  //
  // - versionStepHandle: validity tracks "a version is selected" directly off
  //   the signal-config's radio selection. submit() captures the chosen
  //   version then fetches release+chart-version metadata to prime the editor.
  // - overridesStepHandle: submit() runs the upgrade and on success navigates
  //   back to the release detail page (legacy `redirect: true`).
  versionStepHandle: SignalStepHandle = {
    valid: computed(() => this.versionsConfig.selectedKey() != null),
    submit: async () => {
      const selected = this.versionsConfig.selectedVersion();
      if (!selected) {
        throw new Error('No version selected');
      }
      this.version = selected;
      await firstValueFrom(this.fetchVersionDetails$());
    },
  };

  overridesStepHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    finishButtonText: signal('Upgrade').asReadonly(),
    onEnter: () => {
      this.editor.resizeEditor();
    },
    submit: async () => {
      // showAdvancedOptions branching from the legacy doUpgrade is preserved
      // for parity even though the advanced step is currently commented out
      // of the template. If/when it returns, this branch keeps the second-
      // step submit a no-op (the upgrade fires from the advanced step).
      if (this.showAdvancedOptions) {
        return;
      }
      const result = await firstValueFrom(this.doUpgrade$());
      if (!result.success) {
        throw new Error(result.message || 'Failed to upgrade release');
      }
      // Legacy { redirect: true, redirectPayload: { path: cancelUrl } }
      // navigated back to the release detail. Make explicit.
      await this.router.navigate([this.cancelUrl]);
    },
  };

  constructor() {
    this.cancelUrl = `/workloads/${this.helper.guid}`;

    this.helper.hasUpgrade(true).pipe(
      filter(c => !!c),
      take(1)
    ).subscribe(chart => {
      if (!chart) {
        return;
      }
      const name = chart.upgrade.name;
      const repoName = chart.upgrade.repo.name;
      const version = chart.release.chart.metadata.version;
      this.monocularEndpointId = chart.monocularEndpointId;

      this.versionsConfig.initialize(repoName, name, version, chart.monocularEndpointId);
      void this.versionsConfig.loadAll();
      this.listConfig.set(this.buildListConfig());
    });
  }

  private buildListConfig(): SignalListConfig<MonocularVersion> {
    const versionTypeOptions = signal<SignalListDropdownOption[]>([
      { label: 'Release Versions', value: 'release' },
      { label: 'All Versions', value: 'all' },
    ]);
    return {
      pagedItems: this.versionsConfig.view.pagedItems,
      totalFilteredResults: this.versionsConfig.view.totalFilteredResults,
      totalPages: this.versionsConfig.view.totalPages,
      pageIndex: this.versionsConfig.pageIndex,
      pageSize: this.versionsConfig.pageSize,
      isAnyLoading: this.versionsConfig.isLoading(),
      errorsByCnsi: signal(new Map()),
      pageSizeOptions: [10, 25, 50, 100],
      columns: [
        {
          header: '', key: 'radio',
          kind: 'radio',
          radio: { selectedKey: this.versionsConfig.selectedKey },
          render: () => '',
          widthHint: '3rem',
        },
        {
          header: 'Version', key: 'version',
          kind: 'text',
          render: (v: MonocularVersion) =>
            v.attributes.version + (this.versionsConfig.isCurrent(v) ? ' (current)' : ''),
        },
        {
          header: 'Created', key: 'created',
          kind: 'text',
          render: (v: MonocularVersion) => format(new Date(v.attributes.created), 'PPPppp'),
        },
        {
          header: 'Age', key: 'age',
          kind: 'text',
          render: (v: MonocularVersion) => formatDistance(new Date(v.attributes.created), new Date()),
        },
      ],
      getRowKey: this.versionsConfig.getRowKey,
      emptyMessage: 'There are no versions',
      loadingMessage: 'Loading versions…',
      filterDropdowns: [
        { label: 'Versions', options: versionTypeOptions, selected: this.versionsConfig.versionType },
      ],
    };
  }

  // Update the editor with the chosen version when the user moves to the
  // next step. Returns void on success — the side-effect is priming
  // `this.config` so the editor can render the right schema/values.
  private fetchVersionDetails$(): Observable<void> {
    const chart = this.version.relationships.chart.data;
    const version = this.version.attributes.version;
    const endpointID = this.monocularEndpointId || stratosMonocularEndpointGuid;

    // Fetch the release metadata so that we have the values used to install the current release
    return combineLatest(
      [this.helper.release$, this.chartsService.getVersionFromEndpoint(endpointID, chart.repo.name, chart.name, version)]
    ).pipe(
      take(1),
      tap(([release, chartVersionDetail]) => {
        if (!release || !chartVersionDetail) {
          return;
        }
        this.chartUrl = this.chartsService.getChartURL(chartVersionDetail);
        const schemaUrl = this.chartsService.getChartSchemaURL(chartVersionDetail, chart.name, chart.repo);
        this.config = {
          schemaUrl,
          valuesUrl: `/pp/v1/monocular/values/${endpointID}/${chart.repo.name}/${chart.name}/${version}`,
          releaseValues: release.config
        };
      }),
      map((): void => undefined)
    );
  }

  // Hide/show the advanced options step
  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  // Returns the legacy ActionState shape so the caller can decide
  // success/failure + redirect explicitly. Now backed by the
  // KubeHelmDataService rather than the ngrx upgrade action.
  private doUpgrade$(): Observable<{ success: boolean; message?: string }> {
    const values: HelmUpgradePayload = {
      values: JSON.stringify(this.editor.getValues()),
      restartPods: false,
      chart: {
        name: this.version.relationships.chart.data.name,
        repo: this.version.relationships.chart.data.repo.name,
        version: this.version.attributes.version,
      },
      monocularEndpoint: this.monocularEndpointId === stratosMonocularEndpointGuid ? null : this.monocularEndpointId,
      chartUrl: this.chartUrl
    };

    return new Observable<{ success: boolean; message?: string }>(sub => {
      this.helmDataService.upgrade(
        this.helper.endpointGuid,
        this.helper.namespace,
        this.helper.releaseTitle,
        values,
      ).then(() => {
        sub.next({ success: true });
        sub.complete();
      }).catch((err: Error) => {
        sub.next({ success: false, message: err?.message || 'Upgrade failed' });
        sub.complete();
      });
    });
  }
}
