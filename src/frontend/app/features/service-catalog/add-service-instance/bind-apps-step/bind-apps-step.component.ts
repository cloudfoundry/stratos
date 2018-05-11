import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IApp } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetCreateServiceInstanceApp } from '../../../../store/actions/create-service-instance.actions';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { AppState } from '../../../../store/app-state';
import { applicationSchemaKey, entityFactory, spaceSchemaKey } from '../../../../store/helpers/entity-factory';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { appDataSort } from '../../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})

export class BindAppsStepComponent implements OnDestroy, AfterContentInit {
  validate: Observable<boolean>;
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  allAppsSubscription: Subscription;
  apps$: Observable<APIResource<IApp>[]>;
  // selectedAppGuid: string;
  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
    });


    this.allAppsSubscription = this.store.select(selectCreateServiceInstanceSpaceGuid).pipe(
      filter(p => !!p),
      combineLatest(this.store.select(selectCreateServiceInstanceCfGuid)),
      filter(p => !!p),
      tap(([spaceGuid, cfGuid]) => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, spaceGuid);
        this.apps$ = getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(cfGuid, spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$
          .pipe(
          map(apps => apps.sort(appDataSort)),
          first(),
          map(apps => apps.slice(0, 50))
          );
      })
    ).subscribe();

  }

  ngAfterContentInit() {
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        return this.stepperForm.valid;
      });
  }

  submit = () => {
    if (this.stepperForm.controls.apps.value) {
      this.setApp();
    }
    return { success: true };
  }

  // createBinding = () => {

  //   const appGuid = this.stepperForm.controls.apps.value;

  //   const guid = `${this.servicesService.cfGuid}-${appGuid}-${this.serviceInstanceGuid}`;
  //   let params = this.stepperForm.controls.params.value;
  //   try {
  //     params = JSON.parse(params) || null;
  //   } catch (e) {
  //     params = null;
  //   }

  //   this.store.dispatch(new CreateServiceBinding(
  //     this.servicesService.cfGuid,
  //     guid,
  //     appGuid,
  //     this.serviceInstanceGuid,
  //     params

  //   ));

  //   return this.store.select(selectRequestInfo(serviceBindingSchemaKey, guid));

  // }
  setApp = () => this.store.dispatch(new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value));

  ngOnDestroy(): void {
    this.allAppsSubscription.unsubscribe();
  }
  private displaySnackBar() {
    this.snackBar.open('Failed to create service binding! ', 'Dismiss');
  }
}
