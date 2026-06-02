import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnDestroy,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { combineLatest, firstValueFrom, from, Observable, of, Subscription } from 'rxjs';
import {
  catchError,
  distinctUntilChanged,
  map,
  startWith,
  switchMap,
  take,
} from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { PageHeaderComponent } from '../../../../../core/src/shared/components/page-header/page-header.component';
import {
  SignalStepHandle,
  StepComponent,
  StepOnNextResult,
} from '../../../../../core/src/shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../../../core/src/shared/components/stepper/steppers/steppers.component';
import { ChartsService } from '../../../helm/monocular/shared/services/charts.service';
import { createMonocularProviders } from '../../../helm/monocular/stratos-monocular-providers.helpers';
import { getMonocularEndpoint, stratosMonocularEndpointGuid } from '../../../helm/monocular/stratos-monocular.helper';
import { KubeHelmDataService } from '../../../services/endpoint-data/kube-helm-data.service';
import { HelmChartReference, HelmInstallPayload, KubeNamespace } from '../../../services/endpoint-data/kube-types';
import { KubeNamespaceDataService } from '../../../services/domain-data/kube-namespace-data.service';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes-entity-factory';
import { ChartValuesConfig, ChartValuesEditorComponent } from './../chart-values-editor/chart-values-editor.component';

interface CreateReleaseForm {
  endpoint: FormControl<string>;
  releaseName: FormControl<string>;
  releaseNamespace: FormControl<string>;
  createNamespace: FormControl<boolean>;
}

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PageHeaderComponent,
    SteppersComponent,
    StepComponent,
    ChartValuesEditorComponent
  ],
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

  details: FormGroup<CreateReleaseForm>;
  namespaces$: Observable<string[]>;

  @ViewChild('releaseNameInputField', { static: true }) releaseNameInputField: ElementRef;
  @ViewChild('editor', { static: true }) editor: ChartValuesEditorComponent;

  private subs: Subscription[] = [];
  private createdNamespace = false;

  private chart: HelmChartReference;
  public config: ChartValuesConfig;
  private route = inject(ActivatedRoute);
  public endpointsService = inject(EndpointsService);
  private chartsService = inject(ChartsService);
  private router = inject(Router);
  private helmDataService = inject(KubeHelmDataService);
  private namespaceData = inject(KubeNamespaceDataService);

  // FWT-959 Part 2: signal-native step handles.
  //
  // - detailsStepHandle: validity tracks the form's `valid` state via a
  //   signal mirror of the existing validate$ stream. No submit (the user
  //   advances to Overrides on Next).
  // - overridesStepHandle: submit drives the existing createNamespace +
  //   installChart pipeline; on success the legacy `redirect: true` +
  //   redirectPayload navigates to the workload summary page — we make
  //   that navigation explicit via Router.navigate. onEnter resizes the
  //   chart editor (carried over from the legacy onEnterOverrides).
  detailsStepHandle!: SignalStepHandle;
  overridesStepHandle!: SignalStepHandle;

  constructor() {
    const chart = this.route.snapshot.params as HelmChartReference;
    this.cancelUrl = this.chartsService.getChartSummaryRoute(chart.repo, chart.name, chart.version, this.route);
    this.chart = chart;

    // Fetch the Chart Version metadata so we can get the correct URL for the Chart's JSON Schema
    this.chartsService.getVersion(this.chart.repo, this.chart.name, this.chart.version).pipe(take(1)).subscribe(ch => {
      this.config = {
        valuesUrl: `/pp/v1/monocular/values/${this.chart.endpoint}/${this.chart.repo}/${chart.name}/${this.chart.version}`,
        schemaUrl: this.chartsService.getChartSchemaURL(ch, ch.relationships.chart.data.name, ch.relationships.chart.data.repo)
      };
    });

    this.setupDetailsStep();

    // Build the signal-native step handles after the form is assembled so
    // we can derive validity from validate$ via toSignal.
    this.setupStepHandles();
  }

  private setupDetailsStep() {
    this.details = new FormGroup<CreateReleaseForm>({
      endpoint: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      releaseName: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      releaseNamespace: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      createNamespace: new FormControl(false, { nonNullable: true }) });
    this.details.controls.createNamespace.disable();

    this.kubeEndpoints$ = this.endpointsService.connectedEndpointsOfTypes(KUBERNETES_ENDPOINT_TYPE);

    // All namespaces across the connected kube endpoints, sourced from the
    // signal data service: refresh each endpoint once, then read the
    // aggregate signal. Replaces the legacy getPaginationService(null) read.
    const allNamespaces$ = this.kubeEndpoints$.pipe(
      take(1),
      switchMap(async (endpoints: EndpointModel[]) => {
        const guids = endpoints.map(e => e.guid);
        await Promise.all(guids.map((g: string) => this.namespaceData.refresh({ kubeGuid: g })));
        return this.namespaceData.allNamespacesAcrossEndpoints(guids)();
      }),
    );
    this.namespaces$ = combineLatest([
      allNamespaces$,
      this.details.controls.endpoint.valueChanges.pipe(startWith('')),
      this.details.controls.releaseNamespace.valueChanges.pipe(startWith(''), distinctUntilChanged())
    ]).pipe(
      // Filter out namespaces from other kubes
      map(([namespaces, kubeId, namespace]: [KubeNamespace[], string, string]) => ([
        namespaces.filter(ns => ns.metadata.kubeId === kubeId),
        namespace
      ])),
      // Map to endpoint names
      map(([namespaces, namespace]: [KubeNamespace[], string]) => [
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

    this.validate$ = this.details.statusChanges.pipe(
      startWith(this.details.status),
      map(() => this.details.valid)
    );

    // Auto-select first endpoint
    this.kubeEndpoints$.pipe(take(1)).subscribe(endpoints => {
      if (endpoints.length === 1) {
        this.details.controls.endpoint.setValue(endpoints[0].guid);
      }
    });
  }

  private setupStepHandles() {
    // Signal mirror of validate$. `initialValue` matches the form's initial
    // validity (false — releaseName/releaseNamespace are required and empty).
    const validSignal = toSignal(this.validate$, { initialValue: this.details.valid });
    this.detailsStepHandle = {
      valid: computed(() => !!validSignal()),
    };
    this.overridesStepHandle = {
      // Overrides step has no per-step validation gate; the chart values
      // editor handles its own JSON-schema validation at submit time.
      valid: signal(true).asReadonly(),
      finishButtonText: signal('Install').asReadonly(),
      onEnter: () => {
        // Resize the editor when the step becomes visible.
        this.editor.resizeEditor();
      },
      submit: async () => {
        const result = await firstValueFrom(this.submit$());
        if (!result.success) {
          throw new Error(result.message || 'Failed to install chart');
        }
        if (result.redirect && result.redirectPayload?.path) {
          // Legacy { redirect: true, redirectPayload: { path } } navigated
          // to the workload summary page. Make the navigation explicit so
          // we don't rely on the deprecated stepper redirect plumbing.
          await this.router.navigate(['/' + result.redirectPayload.path]);
        }
      },
    };
  }

  private filterTyped(namespaces: string[], namespace: string): string[] {
    const lowerCase = namespace.toLowerCase();
    return lowerCase.length ? namespaces.filter(ns => ns.toLowerCase().indexOf(lowerCase) >= 0) : namespaces;
  }

  ngOnInit() {
    // Auto select endpoint if there is only one
    this.kubeEndpoints$.pipe(take(1)).subscribe(ep => {
      if (ep.length > 1) {
        this.details.controls.endpoint.setValue(ep[0].guid, { onlySelf: true });
        setTimeout(() => {
          this.releaseNameInputField.nativeElement.focus();
        }, 1);
      }
    });
  }

  // The full submit pipeline used by the signal-handle. Returns the legacy
  // StepOnNextResult shape so the createNamespace + installChart pieces
  // can stay observable-shaped; the handle wraps the result above.
  private submit$ = (): Observable<StepOnNextResult> => {
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

    return from(this.namespaceData.create(
      this.details.controls.endpoint.value,
      this.details.controls.releaseNamespace.value,
    )).pipe(
      map((): StepOnNextResult => {
        this.createdNamespace = true;
        return { success: true };
      }),
      catchError((err: unknown) => of<StepOnNextResult>({
        success: false,
        message: `Failed to create namespace '${this.details.controls.releaseNamespace.value}': `
          + ((err as Error)?.message ?? String(err)),
      })),
    );
  }

  installChart(): Observable<StepOnNextResult> {
    const endpoint = getMonocularEndpoint(this.route, undefined, undefined);
    const formValue = this.details.value;
    // Build the request body
    const values: HelmInstallPayload = {
      endpoint: formValue.endpoint ?? '',
      releaseName: formValue.releaseName || '',
      releaseNamespace: formValue.releaseNamespace || '',
      values: JSON.stringify(this.editor.getValues()),
      chart: {
        name: this.route.snapshot.params.name,
        repo: this.route.snapshot.params.repo,
        version: this.route.snapshot.params.version },
      monocularEndpoint: endpoint === stratosMonocularEndpointGuid ? null : endpoint,
      chartUrl: '' // Will be set after fetching chart info
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
        // Signal-native install — call the data service directly. The
        // service handles HTTP + cache refresh and surfaces failures as
        // a rejected promise we map back to the legacy StepOnNextResult.
        return new Observable<StepOnNextResult>(sub => {
          this.helmDataService.install(values).then(() => {
            sub.next({
              success: true,
              redirect: true,
              redirectPayload: {
                path: `workloads/${values.endpoint}:${values.releaseNamespace}:${values.releaseName}/summary`,
              },
              message: '',
            });
            sub.complete();
          }).catch((err: Error) => {
            sub.next({ success: false, message: err?.message || 'Install failed' });
            sub.complete();
          });
        });
      })
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }
}
