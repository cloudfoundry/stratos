import { Component, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import {
  StepComponent,
  StepOnNextFunction,
  StepOnNextResult,
} from '../../../../../../core/src/shared/components/stepper/step/step.component';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { stratosMonocularEndpointGuid } from '../../../helm/monocular/stratos-monocular.helper';
import { HelmUpgradeValues, MonocularVersion } from '../../../helm/store/helm.types';
import { ChartValuesConfig, ChartValuesEditorComponent } from '../chart-values-editor/chart-values-editor.component';
import { HelmReleaseHelperService } from '../release/tabs/helm-release-helper.service';
import { HelmReleaseGuid } from '../workload.types';
import { getFirstChartUrl } from '../workload.utils';
import { workloadsEntityCatalog } from './../workloads-entity-catalog';
import { ReleaseUpgradeVersionsListConfig } from './release-version-list-config';

@Component({
  selector: 'app-upgrade-release',
  templateUrl: './upgrade-release.component.html',
  styleUrls: ['./upgrade-release.component.scss'],
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
export class UpgradeReleaseComponent {

  @ViewChild('editor', { static: true }) editor: ChartValuesEditorComponent;

  public cancelUrl;
  public listConfig: ReleaseUpgradeVersionsListConfig;
  public validate$: Observable<boolean>;
  private version: MonocularVersion;

  public config: ChartValuesConfig;

  private monocularEndpointId: string;

  // Future
  public showAdvancedOptions = false;

  constructor(
    store: Store<any>,
    public helper: HelmReleaseHelperService
  ) {

    this.cancelUrl = `/workloads/${this.helper.guid}`;

    this.helper.hasUpgrade(true).pipe(
      filter(c => !!c),
      first()
    ).subscribe(chart => {
      const name = chart.upgrade.name;
      const repoName = chart.upgrade.repo.name;
      const version = chart.release.chart.metadata.version;
      this.listConfig = new ReleaseUpgradeVersionsListConfig(store, repoName, name, version, chart.monocularEndpointId);
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
    });
  }

  // Ensure the editor is resized when the overrides step becomes visible
  onEnterOverrides = () => {
    this.editor.resizeEditor();
  };

  // Update the editor with the chosen version when the user moves to the next step
  onNext = (): Observable<StepOnNextResult> => {
    const chart = this.version.relationships.chart.data;
    const version = this.version.attributes.version;

    // Fetch the release metadata so that we have the values used to install the current release
    return this.helper.release$.pipe(
      first(),
      tap(release => {
        this.config = {
          schemaUrl: `/pp/v1/chartsvc/v1/assets/${chart.repo.name}/${chart.name}/versions/${version}/values.schema.json`,
          valuesUrl: `/pp/v1/chartsvc/v1/assets/${chart.repo.name}/${chart.name}/versions/${version}/values.yaml`,
          releaseValues: release.config
        };
      }),
      map(() => {
        return { success: true };
      })
    );
  };

  // Hide/show the advanced options step
  toggleAdvancedOptions() {
    this.showAdvancedOptions = !this.showAdvancedOptions;
  }

  doUpgrade: StepOnNextFunction = (index: number, step: StepComponent) => {
    // If we are showing the advanced options, don't upgrade if we aer not on the last step
    if (this.showAdvancedOptions && index === 1) {
      return of({ success: true });
    }

    // Add the chart url into the values
    const values: HelmUpgradeValues = {
      values: JSON.stringify(this.editor.getValues()),
      restartPods: false,
      chart: {
        name: this.version.relationships.chart.data.name,
        repo: this.version.relationships.chart.data.repo.name,
        version: this.version.attributes.version,
      },
      monocularEndpoint: this.monocularEndpointId === stratosMonocularEndpointGuid ? null : this.monocularEndpointId,
      chartUrl: getFirstChartUrl(this.version)
    };

    // Make the request
    return workloadsEntityCatalog.release.api.upgrade<ActionState>(this.helper.releaseTitle,
      this.helper.endpointGuid, this.helper.namespace, values).pipe(
        // Wait for result of request
        filter(state => !!state),
        pairwise(),
        filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
        map(([, newVal]) => newVal),
        map(result => ({
          success: !result.error,
          redirect: !result.error,
          redirectPayload: {
            path: !result.error ? this.cancelUrl : ''
          },
          message: !result.error ? '' : result.message
        }))
      );
  };
}
