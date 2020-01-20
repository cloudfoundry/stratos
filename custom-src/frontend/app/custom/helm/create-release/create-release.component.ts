import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTextareaAutosize } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { PaginationMonitorFactory } from 'frontend/packages/store/src/monitors/pagination-monitor.factory';
import { getPaginationObservables } from 'frontend/packages/store/src/reducers/pagination-reducer/pagination-reducer.helper';
import { BehaviorSubject, combineLatest, Observable, of, Subscription } from 'rxjs';
import {
  delay,
  distinctUntilChanged,
  filter,
  first,
  map,
  pairwise,
  publishReplay,
  refCount,
  startWith,
  switchMap,
} from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { safeUnsubscribe } from '../../../core/utils.service';
import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../shared/components/stepper/step/step.component';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { KubernetesNamespace } from '../../kubernetes/store/kube.types';
import { CreateKubernetesNamespace, GetKubernetesNamespaces } from '../../kubernetes/store/kubernetes.actions';
import { helmReleaseEntityKey } from '../../kubernetes/workloads/store/workloads-entity-factory';
import { HelmInstall } from '../store/helm.actions';
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

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private httpClient: HttpClient,
    private confirmDialog: ConfirmationDialogService,
    private pmf: PaginationMonitorFactory
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;

    this.setupDetailsStep();

    this.overrides = new FormGroup({
      values: new FormControl('')
    });

    // Fetch the values.yaml for the Chart
    const valuesYamlUrl = `/pp/v1/chartsvc/v1/assets/${chart.repo}/${chart.chartName}/versions/${chart.version}/values.yaml`;

    // TODO: RC Error handling
    this.httpClient.get(valuesYamlUrl, { responseType: 'text' }).subscribe(response => {
      this.valuesYaml = response;
    });
  }

  private setupDetailsStep() {
    this.kubeEndpoints$ = this.endpointsService.connectedEndpointsOfTypes(KUBERNETES_ENDPOINT_TYPE);

    this.namespaces$ = this.endpointChanged.asObservable().pipe(
      switchMap(endpoint => {
        const action = new GetKubernetesNamespaces(endpoint);
        return getPaginationObservables<KubernetesNamespace>({
          store: this.store,
          action,
          paginationMonitor: this.pmf.create(action.paginationKey, action)
        }).entities$;
      }),
      map((namespaces: KubernetesNamespace[]) => namespaces.map(namespace => namespace.metadata.name)),
      publishReplay(1),
      refCount(),
    );

    this.details = new FormGroup({
      endpoint: new FormControl('', Validators.required),
      releaseName: new FormControl('', Validators.required),
      releaseNamespace: new FormControl(''),
      createNamespace: new FormControl(false),
    });
    this.details.controls.createNamespace.disable();

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
      ])
        .pipe().subscribe(([namespaces, namespace, create]) => {
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

    const createNamespace$ = this.details.controls.createNamespace.value ? this.createNamespace() : of({ success: true });

    return createNamespace$.pipe(
      switchMap(createRes => {
        if (!createRes.success) {
          return createRes;
        }
        return this.installChart();
      })
    );
  }

  createNamespace(): Observable<StepOnNextResult> {
    // TODO: RC namespace exists from previous run??
    const action = new CreateKubernetesNamespace();
    return of({
      success: false
    });
  }

  installChart(): Observable<StepOnNextResult> {
    // Build the request body
    const values: HelmInstallValues = {
      ...this.details.value,
      ...this.overrides.value,
      chart: this.route.snapshot.params
    };

    // Make the request
    const action = new HelmInstall(values);
    this.store.dispatch(action);

    const releaseEntityConfig = entityCatalog.getEntity(KUBERNETES_ENDPOINT_TYPE, helmReleaseEntityKey);

    // Wait for result of request
    return of(true).pipe(
      delay(1),
      switchMap(() => releaseEntityConfig.getEntityMonitor(this.store, action.guid).updatingSection$),
      map(updatingSection => updatingSection[action.updatingKey]),
      filter(update => !!update),
      pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([, newVal]) => newVal),
      map(result => ({
        success: !result.error,
        redirect: !result.error,
        redirectPayload: {
          path: !result.error ? `workloads/${values.endpoint}:${values.releaseNamespace}:${values.releaseName}/summary` : ''
        },
        message: !result.error ? '' : result.message
      })),
    );
  }

  ngOnDestroy() {
    safeUnsubscribe(...this.subs);
  }

}
