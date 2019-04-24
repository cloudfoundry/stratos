import { HttpClient } from '@angular/common/http';
import { Component, ElementRef, ViewChild } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { MatTextareaAutosize } from '@angular/material';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of, Subscription } from 'rxjs';
import { delay, filter, map, pairwise, switchMap } from 'rxjs/operators';

import { AppState } from '../../../../../store/src/app-state';
import { selectUpdateInfo } from '../../../../../store/src/selectors/api.selectors';
import { EndpointsService } from '../../../core/endpoints.service';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { HelmInstall } from '../store/helm.actions';
import { helmReleaseSchemaKey } from '../store/helm.entities';
import { HELM_INSTALLING_KEY, HelmInstallValues } from '../store/helm.types';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent {

  // isLoading$ = observableOf(false);
  paginationStateSub: Subscription;

  public cancelUrl: string;
  kubeEndpoints$: Observable<any>;
  validate$: Observable<boolean>;

  details: FormGroup;
  overrides: FormGroup;

  @ViewChild('overridesYamlTextArea') overridesYamlTextArea: ElementRef;
  @ViewChild(MatTextareaAutosize) overridesYamlAutosize: MatTextareaAutosize;

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private httpClient: HttpClient
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;

    this.kubeEndpoints$ = this.endpointsService.connectedEndpointsOfTypes('k8s');

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
  }

  onEnterOverrides = () => {
    setTimeout(() => {
      this.overridesYamlAutosize.resizeToFitContent(true);
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

    // Wait for result of request
    return of(true).pipe(
      delay(1),
      switchMap(() => this.store.select(selectUpdateInfo(helmReleaseSchemaKey, action.guid(), HELM_INSTALLING_KEY))),
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
