import { HttpClient } from '@angular/common/http';
import { AfterContentInit, Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';

import { ISpace } from '../../../../core/cf-api.types';
import { StepOnNextFunction } from '../../../../shared/components/stepper/step/step.component';
import { AppState } from '../../../../../../store/src/app-state';
import { EndpointsService } from '../../../../core/endpoints.service';
import { ActivatedRoute } from '@angular/router';
import { ClearPaginationOfType } from '../../../../../../store/src/actions/pagination.actions';
import { helmReleasesSchemaKey } from '../../store/helm.entities';
import { RouterNav } from '../../../../../../store/src/actions/router.actions';

@Component({
  selector: 'app-create-release-step-dest',
  templateUrl: './create-release-step-dest.component.html',
  styleUrls: ['./create-release-step-dest.component.scss'],
})
export class CreateApplicationStepDestinationComponent implements OnInit, AfterContentInit {

  kubeEndpoints$: Observable<any>;

  form: FormGroup;

  constructor(
    public endpointsService: EndpointsService,
    private store: Store<AppState>,
    private route: ActivatedRoute,
    private httpClient: HttpClient
  ) {
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

    this.form = new FormGroup({
      endpoint: new FormControl('', Validators.required),
      releaseName: new FormControl('', Validators.required),
      releaseNamespace: new FormControl('', Validators.required),
      values: new FormControl('')
    });

    this.validate$ = this.form.statusChanges.pipe(
      map(() => this.form.valid )
    );
  }

  public spaces$: Observable<ISpace[]>;
  public hasSpaces$: Observable<boolean>;
  public hasOrgs$: Observable<boolean>;

  validate$: Observable<boolean>;

  onNext: StepOnNextFunction = () => {

    console.log('INSTALLING!');

    // Build the request body

    console.log(this.form);
    const values = {...this.form.value};
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
        this.store.dispatch(new RouterNav({ path: ['monocular/releases']}));
      }),
      map(d => ({ success: true })),
    );
  }

  ngOnInit() {


  }

  ngAfterContentInit() {
    // this.validate = this.cfForm.statusChanges.pipe(
    //   startWith(this.cfForm.valid),
    //   map(() => this.cfForm.valid),
    //   observeOn(asapScheduler)
    // );
  }

}
