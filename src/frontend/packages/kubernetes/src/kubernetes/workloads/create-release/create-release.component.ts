import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, startWith, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { helmEntityCatalog } from '../../../helm/helm-entity-catalog';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { createMonocularProviders } from '../../../helm/monocular/stratos-monocular-providers.helpers';
import { getMonocularEndpoint, stratosMonocularEndpointGuid } from '../../../helm/monocular/stratos-monocular.helper';
import { HelmChartReference, HelmInstallValues } from '../../../helm/store/helm.types';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { KubernetesNamespace } from '../../store/kube.types';
import { ChartValuesConfig, ChartValuesEditorComponent } from './../chart-values-editor/chart-values-editor.component';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
  providers: [
    ...createMonocularProviders()
  ]
})
export class CreateReleaseComponent implements OnInit, OnDestroy {

  // isLoading$ = observableOf(false);
  paginationStateSub: Subscription;

  public cancelUrl: string;
  kubeEndpoints$: Observable<any>;
  validate$: Observable<boolean>;

  details: FormGroup;
  namespaces$: Observable<string[]>;

  private endpointChanged = new BehaviorSubject(null);

  @ViewChild('releaseNameInputField', { static: true }) releaseNameInputField: ElementRef;
  @ViewChild('editor', { static: true }) editor: ChartValuesEditorComponent;

  private subs: Subscription[] = [];
  private createdNamespace = false;

  private chart: HelmChartReference;
  public config: ChartValuesConfig;

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private chartsService: ChartsService,
  ) {
    const chart = this.route.snapshot.params as HelmChartReference;
    this.cancelUrl = this.chartsService.getChartSummaryRoute(chart.repo, chart.name, chart.version, this.route);
    this.chart = chart;

    // Fetch the Chart Version metadata so we can get the correct URL for the Chart's JSON Schema
    this.chartsService.getVersion(this.chart.repo, this.chart.name, this.chart.version).pipe(first()).subscribe(ch => {
      this.config = {
        valuesUrl: `/pp/v1/monocular/values/${this.chart.endpoint}/${this.chart.repo}/${chart.name}/${this.chart.version}`,
        schemaUrl: this.chartsService.getChartSchemaURL(ch, ch.relationships.chart.data.name, ch.relationships.chart.data.repo)
      };
    });

    this.setupDetailsStep();
  }

  private setupDetailsStep() {
    this.details = new FormGroup({
      endpoint: new FormControl('', Validators.required),
      releaseName: new FormControl('', Validators.required),
      releaseNamespace: new FormControl('', Validators.required),
      createNamespace: new FormControl(false),
    });
    this.details.controls.createNamespace.disable();

    this.kubeEndpoints$ = this.endpointsService.connectedEndpointsOfTypes(KUBERNETES_ENDPOINT_TYPE);

    const allNamespaces$ = kubeEntityCatalog.namespace.store.getPaginationService(null).entities$.pipe(
      filter(namespaces => !!namespaces),
      first()
    );
    this.namespaces$ = combineLatest([
      allNamespaces$,
      this.endpointChanged.asObservable(),
      this.details.controls.releaseNamespace.valueChanges.pipe(startWith(''), distinctUntilChanged())
    ]).pipe(
      // Filter out namespaces from other kubes
      map(([namespaces, kubeId, namespace]: [KubernetesNamespace[], string, string]) => ([
        namespaces.filter(ns => ns.metadata.kubeId === kubeId),
        namespace
      ])),
      // Map to endpoint names
      map(([namespaces, namespace]: [KubernetesNamespace[], string]) => [
        namespaces.map(ns => ns.metadata.name),
        namespace
      ]),
      // Filter out namespaces not matching existing text
      map(([namespaces, namespace]: [string[], string]) => this.filterTyped(namespaces, namespace)),
    );

    const namespaceChanged$ = this.details.controls.releaseNamespace.valueChanges.pipe(
      distinctUntilChanged()
    );
    const createNamespaceChanged$ = this.details.controls.createNamespace.valueChanges.pipe(
      startWith(false),
      distinctUntilChanged()
    );

    this.subs.push(
      combineLatest([
        this.namespaces$,
        namespaceChanged$,
        createNamespaceChanged$
      ]).pipe().subscribe(([namespaces, namespace, create]) => {
        const namespaceExists = !!namespaces.find(val => val === namespace);
        if (namespaceExists) {
          // All is fine
          this.details.controls.releaseNamespace.validator = () => null;
          this.details.controls.createNamespace.setValue(false);
          this.details.controls.createNamespace.disable();
        } else if (!namespace) {
          // Invalid - missing namespace
          this.details.controls.releaseNamespace.validator = () => ({ required: true });
          this.details.controls.createNamespace.disable();
        } else if (!create) {
          // Invalid - namespace doesn't exist and not creating
          this.details.controls.releaseNamespace.validator = () => ({ namespaceDoesNotExist: true });
          this.details.controls.createNamespace.enable();
        } else {
          // Valid - namespace doesn't exist but creating
          this.details.controls.releaseNamespace.validator = () => null;
          // this.details.controls.createNamespace.disable();
        }
        this.details.controls.releaseNamespace.updateValueAndValidity();
      })
    );

    this.subs.push(
      this.details.controls.endpoint.valueChanges.subscribe(val => {
        this.endpointChanged.next(val);
      })
    );

    this.validate$ = this.details.statusChanges.pipe(
      map(() => this.details.valid)
    );

    // Auto-select first endpoint
    this.kubeEndpoints$.pipe(first()).subscribe(endpoints => {
      if (endpoints.length === 1) {
        this.details.controls.endpoint.setValue(endpoints[0].guid);
      }
    });
  }

  private filterTyped(namespaces: string[], namespace: string): string[] {
    const lowerCase = namespace.toLowerCase();
    return lowerCase.length ? namespaces.filter(ns => ns.toLowerCase().indexOf(lowerCase) >= 0) : namespaces;
  }

  ngOnInit() {
    // Auto select endpoint if there is only one
    this.kubeEndpoints$.pipe(first()).subscribe(ep => {
      if (ep.length > 1) {
        this.details.controls.endpoint.setValue(ep[0].guid, { onlySelf: true });
        this.endpointChanged.next(ep[0].guid);
        setTimeout(() => {
          this.releaseNameInputField.nativeElement.focus();
        }, 1);
      }
    });
  }

  // Ensure the editor is resized when the overrides step becomes visible
  onEnterOverrides = () => {
    this.editor.resizeEditor();
  };

  submit: StepOnNextFunction = () => {
    return this.createNamespace().pipe(
      switchMap(createRes => createRes.success ? this.installChart() : of(createRes))
    );
  };

  createNamespace(): Observable<StepOnNextResult> {
    if (!this.details.controls.createNamespace.value || this.createdNamespace) {
      return of({
        success: true
      });
    }

    return kubeEntityCatalog.namespace.api.create<RequestInfoState>(
      this.details.controls.releaseNamespace.value,
      this.details.controls.endpoint.value
    ).pipe(
      pairwise(),
      filter(([oldVal, newVal]) => oldVal.creating && !newVal.creating),
      map(([, newVal]) => newVal),
      map(state => {
        if (state.error) {
          return {
            success: false,
            message: `Failed to create namespace '${this.details.controls.releaseNamespace.value}': ` + state.message
          };
        }
        this.createdNamespace = true;
        return {
          success: true
        };
      })
    );
  }

  installChart(): Observable<StepOnNextResult> {
    const endpoint = getMonocularEndpoint(this.route, null, null);
    // Build the request body
    const values: HelmInstallValues = {
      ...this.details.value,
      values: JSON.stringify(this.editor.getValues()),
      chart: {
        name: this.route.snapshot.params.name,
        repo: this.route.snapshot.params.repo,
        version: this.route.snapshot.params.version,
      },
      monocularEndpoint: endpoint === stratosMonocularEndpointGuid ? null : endpoint
    };

    // Get the chart first, so we can get then install URL, then install
    return this.chartsService.getVersion(this.chart.repo, this.chart.name, this.chart.version).pipe(
      switchMap(chartInfo => {
        if (!chartInfo) {
          throw new Error('Could not get Chart URL');
        }
        // Add the chart url into the values
        values.chartUrl = this.chartsService.getChartURL(chartInfo);
        if (values.chartUrl.length === 0) {
          throw new Error('Could not get Chart URL');
        }
        // Make the request
        return helmEntityCatalog.chart.api.install<RequestInfoState>(values).pipe(
          // Wait for result of request
          filter(state => !!state),
          pairwise(),
          filter(([oldVal, newVal]) => (oldVal.creating && !newVal.creating)),
          map(([, newVal]) => newVal),
          map(result => ({
            success: !result.error,
            redirect: !result.error,
            redirectPayload: {
              path: !result.error ? `workloads/${values.endpoint}:${values.releaseNamespace}:${values.releaseName}/summary` : ''
            },
            message: !result.error ? '' : result.message
          }))
        );
      })
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }
}
