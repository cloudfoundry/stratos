import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTextareaAutosize } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { delay, filter, first, map, pairwise, switchMap, tap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
import { EndpointsService } from '../../../core/endpoints.service';
import { ConfirmationDialogConfig } from '../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../shared/components/confirmation-dialog.service';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { KUBERNETES_ENDPOINT_TYPE } from '../../kubernetes/kubernetes-entity-factory';
import { HELM_ENDPOINT_TYPE, helmReleaseEntityKey } from '../helm-entity-factory';
import { HelmInstall } from '../store/helm.actions';
import { HELM_INSTALLING_KEY, HelmInstallValues } from '../store/helm.types';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent implements OnInit {

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
  overrides: FormGroup;

  @ViewChild('releaseNameInputField', { static: true }) releaseNameInputField: ElementRef;
  @ViewChild('overridesYamlTextArea', { static: true }) overridesYamlTextArea: ElementRef;
  @ViewChild(MatTextareaAutosize, { static: false }) overridesYamlAutosize: MatTextareaAutosize;

  public valuesYaml = '';

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private httpClient: HttpClient,
    private confirmDialog: ConfirmationDialogService,
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;

    this.kubeEndpoints$ = this.endpointsService.connectedEndpointsOfTypes(KUBERNETES_ENDPOINT_TYPE);

    this.details = new FormGroup({
      endpoint: new FormControl('', Validators.required),
      releaseName: new FormControl('', Validators.required),
      releaseNamespace: new FormControl('', Validators.required),
    });

    this.overrides = new FormGroup({
      values: new FormControl('')
    });

    this.validate$ = this.details.statusChanges.pipe(
      map(() => this.details.valid)
    );

    // Fetch the values.yaml for the Chart
    const valuesYamlUrl = `/pp/v1/chartsvc/v1/assets/${chart.repo}/${chart.chartName}/versions/${chart.version}/values.yaml`;

    this.httpClient.get(valuesYamlUrl, { responseType: 'text' }).subscribe(response => {
      this.valuesYaml = response;
    });
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
    this.kubeEndpoints$.pipe(
      first(),
      tap(ep => {
        if (ep.length === 1) {
          this.details.controls.endpoint.setValue(ep[0].guid, { onlySelf: true });
          setTimeout(() => {
            this.releaseNameInputField.nativeElement.focus();
          }, 1);
        }
      })
    ).subscribe();
  }

  onEnterOverrides = () => {
    setTimeout(() => {
      // this.overridesYamlAutosize.resizeToFitContent(true);
      this.overridesYamlTextArea.nativeElement.focus();
    }, 1);
  }

  submit: StepOnNextFunction = () => {
    // Build the request body
    const values: HelmInstallValues = {
      ...this.details.value,
      ...this.overrides.value,
      chart: this.route.snapshot.params
    };

    // Make the request
    const action = new HelmInstall(values);
    this.store.dispatch(action);

    const releaseEntityConfig = entityCatalog.getEntity(HELM_ENDPOINT_TYPE, helmReleaseEntityKey);

    // Wait for result of request
    return of(true).pipe(
      delay(1),
      switchMap(() => releaseEntityConfig.getEntityMonitor(this.store, action.guid()).updatingSection$),
      map(updatingSection => updatingSection[HELM_INSTALLING_KEY]),
      filter(update => !!update),
      pairwise(),
      filter(([oldVal, newVal]) => (oldVal.busy && !newVal.busy)),
      map(([oldVal, newVal]) => newVal),
      map(result => ({
        success: !result.error,
        redirect: !result.error,
        redirectPayload: {
          path: 'monocular/releases'
        },
        message: !result.error ? '' : result.message
      })));

  }

}
