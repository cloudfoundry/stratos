import { HttpClient } from '@angular/common/http';
import { Component } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { ClearPaginationOfType } from '../../../../../store/src/actions/pagination.actions';
import { RouterNav } from '../../../../../store/src/actions/router.actions';
import { AppState } from '../../../../../store/src/app-state';
import { EndpointsService } from '../../../core/endpoints.service';
import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { helmReleasesSchemaKey } from '../store/helm.entities';

@Component({
  selector: 'app-create-release',
  templateUrl: './create-release.component.html',
  styleUrls: ['./create-release.component.scss'],
})
export class CreateReleaseComponent {

  isLoading$ = observableOf(false);
  paginationStateSub: Subscription;

  public cancelUrl: string;
  kubeEndpoints$: Observable<any>;
  validate$: Observable<boolean>;

  details: FormGroup;
  overrides: FormGroup;

  constructor(
    private route: ActivatedRoute,
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private httpClient: HttpClient
  ) {
    const chart = this.route.snapshot.params;
    this.cancelUrl = `/monocular/charts/${chart.repo}/${chart.chartName}/${chart.version}`;

    this.kubeEndpoints$ = this.endpointsService.endpoints$.pipe(
      map(ep => {
        const kubes = [];
        Object.values(ep).forEach(endpoint => {
          if (endpoint.cnsi_type === 'k8s') {
            kubes.push({
              name: endpoint.name,
              guid: endpoint.guid
            });
          }
        });
        return kubes;
      })
    );

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

  submit: StepOnNextFunction = () => {

    console.log('INSTALLING!');

    // Build the request body

    console.log(this.details);
    const values = {
      ...this.details.value,
      ...this.overrides.value
    };
    values.chart = this.route.snapshot.params;

    console.log(values);

    // This needs to be done via an action
    // Using http client diretcly for testing

    const obs$ = this.httpClient.post('/pp/v1/helm/install', values);
    // this.store.dispatch(new SetCFDetails({
    //   cloudFoundry: this.cfOrgSpaceService.cf.select.getValue(),
    //   org: this.cfOrgSpaceService.org.select.getValue(),
    //   space: this.cfOrgSpaceService.space.select.getValue()
    // }));
    return obs$.pipe(
      tap(() => {
        // Redirect
        this.store.dispatch(new ClearPaginationOfType(helmReleasesSchemaKey));
        this.store.dispatch(new RouterNav({ path: ['monocular/releases'] }));
      }),
      map(d => ({ success: true })),
      catchError(err => observableOf({ success: false }))
    );
  }

}
