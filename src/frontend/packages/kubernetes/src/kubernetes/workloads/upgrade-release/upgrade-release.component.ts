import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@stratosui/store';
import { combineLatest, firstValueFrom, Observable, Subscription } from 'rxjs';
import { filter, map, take, tap } from 'rxjs/operators';

import { ListComponent } from '../../../../../core/src/shared/components/list/list.component';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
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
import { ReleaseUpgradeVersionsListConfig } from './release-version-list-config';

@Component({
  selector: 'app-upgrade-release',
  templateUrl: './upgrade-release.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ChartValuesEditorComponent,
    ListComponent,
    PageHeaderComponent,
    StepComponent,
    SteppersComponent
  ],
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
    },
    ...createMonocularProviders()
  ]
})
export class UpgradeReleaseComponent implements OnDestroy {

  @ViewChild('editor', { static: true }) editor: ChartValuesEditorComponent;

  public cancelUrl;
  public listConfig: ReleaseUpgradeVersionsListConfig;
  public validate$: Observable<boolean>;
  private version: MonocularVersion;

  public config: ChartValuesConfig;

  private monocularEndpointId: string;

  // Future
  public showAdvancedOptions = false;

  private chartUrl: string;
  private store = inject(Store<any>);
  public helper = inject(HelmReleaseHelperService);
  private chartsService = inject(ChartsService);
  private router = inject(Router);
  private helmDataService = inject(KubeHelmDataService);

  // FWT-959 Part 2: signal-native step handles.
  //
  // - versionStepHandle: validity tracks "exactly one version selected" via
  //   a signal mirror of the listConfig's selectedRows$ stream. submit()
  //   replaces the legacy onNext — fetches release+chart-version metadata
  //   and primes `this.config` for the editor.
  // - overridesStepHandle: submit() runs the upgrade and on success
  //   navigates back to the release detail page (legacy `redirect: true`
  //   + redirectPayload = cancelUrl).
  //
  // The list-config + validate$ stream are set asynchronously inside the
  // hasUpgrade() subscribe, so the version-handle's `valid` signal starts
  // false and is fed by a subscription wired in the same subscribe block.
  private versionValid = signal<boolean>(false);
  private validateSub: Subscription;

  versionStepHandle: SignalStepHandle = {
    valid: this.versionValid.asReadonly(),
    submit: async () => {
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
      this.listConfig = new ReleaseUpgradeVersionsListConfig(this.store, repoName, name, version, chart.monocularEndpointId);
      this.monocularEndpointId = chart.monocularEndpointId;

      // First step is valid when a version has been selected
      this.validate$ = this.listConfig.versionsDataSource.selectedRows$.pipe(
        map((rows: Map<string, any>) => {
          if (rows && rows.size === 1) {
            this.version = rows.values().next().value;
            return true;
          }
          return false;
        })
      );

      // Mirror validate$ into the version-step handle's signal so the
      // signal-handle valid() flips reactively as the user picks a row.
      this.validateSub = this.validate$.subscribe(v => this.versionValid.set(!!v));
    });
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

  ngOnDestroy(): void {
    this.validateSub?.unsubscribe();
  }
}
