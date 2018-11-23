import { AfterContentInit, Component, Input, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { BehaviorSubject, Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, first, map, switchMap, tap } from 'rxjs/operators';

import { IApp } from '../../../../core/cf-api.types';
import { appDataSort } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { PaginationMonitorFactory } from '../../../monitors/pagination-monitor.factory';
import { StepOnNextResult } from '../../stepper/step/step.component';
import { CsiGuidsService } from '../csi-guids.service';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input()
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';
  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
    });
  }

  private setBoundApp() {
    if (this.boundAppId) {
      this.stepperForm.controls.apps.setValue(this.boundAppId);
      this.stepperForm.controls.apps.disable();
      this.guideText = 'Specify binding params (optional)';
    }
  }

  ngAfterContentInit() {
    this.validateSubscription = this.stepperForm.statusChanges.pipe(
      map(() => {
        if (this.stepperForm.pristine) {
          setTimeout(() => this.validate.next(true));
        }
        setTimeout(() => this.validate.next(this.stepperForm.valid));
      })
    ).subscribe();


    this.apps$ = this.store.select(selectCreateServiceInstance).pipe(
      filter(p => !!p && !!p.spaceGuid && !!p.cfGuid),
      switchMap(createServiceInstance => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstance.spaceGuid);
        return getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(createServiceInstance.cfGuid, createServiceInstance.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;
      }));
    this.setBoundApp();
  }

  submit = (): Observable<StepOnNextResult> => {
    this.setApp();
    return observableOf({ success: true });
  }

  setApp = () => this.store.dispatch(
    new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.stepperForm.controls.params.value)
  )

  ngOnDestroy(): void {
    this.validateSubscription.unsubscribe();
  }

}
