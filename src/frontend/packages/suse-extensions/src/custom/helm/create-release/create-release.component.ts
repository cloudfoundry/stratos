import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTextareaAutosize } from '@angular/material/input';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, first, map, pairwise, startWith, switchMap } from 'rxjs/operators';

import { EndpointsService } from '../../../../../core/src/core/endpoints.service';
import { safeUnsubscribe } from '../../../../../core/src/core/utils.service';
import { ConfirmationDialogConfig } from '../../../../../core/src/shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../../core/src/shared/components/confirmation-dialog.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../../core/src/shared/components/stepper/step/step.component';
import { RequestInfoState } from '../../../../../store/src/reducers/api-request-reducer/types';
import { kubeEntityCatalog } from '../../kubernetes/kubernetes-entity-catalog';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubernetesNamespace } from '../../kubernetes/store/kube.types';
import { helmEntityCatalog } from '../helm-entity-catalog';
import { HelmInstallValues } from '../store/helm.types';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent implements OnInit, OnDestroy {

  // Confirmation dialog
  overwriteValuesConfirmation = new ConfirmationDialogConfig(
    'Overwrite Values?',
    'Are you sure you want to replace your values with those from values.yaml?',
    'Overwrite'
  );

  // isLoading$ = observableOf(false);
  paginationStateSub: Subscription;

  public cancelUrl: string;
  kubeEndpoints$: Observable<any>;
  validate$: Observable<boolean>;

  details: FormGroup;
  namespaces$: Observable<string[]>;
  overrides: FormGroup;

  private endpointChanged = new BehaviorSubject(null);

  @ViewChild('releaseNameInputField', { static: true }) releaseNameInputField: ElementRef;
  @ViewChild('overridesYamlTextArea', { static: true }) overridesYamlTextArea: ElementRef;
  @ViewChild(MatTextareaAutosize, { static: false }) overridesYamlAutosize: MatTextareaAutosize;

  public valuesYaml = '';

  private subs: Subscription[] = [];
  private createdNamespace = false;

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private httpClient: HttpClient,
    private confirmDialog: ConfirmationDialogService,
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;

    this.setupDetailsStep();

    this.overrides = new FormGroup({
      values: new FormControl('')
    });

    // Fetch the values.yaml for the Chart
    const valuesYamlUrl = `/pp/v1/chartsvc/v1/assets/${chart.repo}/${chart.chartName}/versions/${chart.version}/values.yaml`;

    this.httpClient.get(valuesYamlUrl, { responseType: 'text' })
      .subscribe(response => {
        this.valuesYaml = response;
      }, err => {
        console.error('Failed to fetch chart values: ', err.message || err);
      });
  }

  private setupDetailsStep() {
    this.details = new FormGroup({
      endpoint: new FormControl('', Validators.required),
      releaseName: new FormControl('', Validators.required),
      releaseNamespace: new FormControl(''),
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

  public useValuesYaml() {
    if (this.overrides.value.values.length !== 0) {
      this.confirmDialog.open(this.overwriteValuesConfirmation, () => {
        this.replaceWithValuesYaml();
      });

    } else {
      this.replaceWithValuesYaml();
    }
  }

  private replaceWithValuesYaml() {
    this.overrides.controls.values.setValue(this.valuesYaml, { onlySelf: true });
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

  onEnterOverrides = () => {
    setTimeout(() => {
      // this.overridesYamlAutosize.resizeToFitContent(true);
      this.overridesYamlTextArea.nativeElement.focus();
    }, 1);
  }

  submit: StepOnNextFunction = () => {
    return this.createNamespace().pipe(
      switchMap(createRes => createRes.success ? this.installChart() : of(createRes))
    );
  }

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
    // Build the request body
    const values: HelmInstallValues = {
      ...this.details.value,
      ...this.overrides.value,
      chart: this.route.snapshot.params
    };

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
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }

}
