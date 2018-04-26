import { Component, OnDestroy, OnInit, AfterContentInit } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { Subscription } from 'rxjs/Subscription';

import { IApp } from '../../../../core/cf-api.types';
import { AppState } from '../../../../store/app-state';
import { APIResource } from '../../../../store/types/api.types';
import { selectSpaceGuid, selectCreateServiceInstance } from '../../../../store/selectors/create-service-instance.selectors';
import { tap, filter, map } from 'rxjs/operators';
import { createEntityRelationPaginationKey } from '../../../../store/helpers/entity-relations.types';
import { spaceSchemaKey, entityFactory, applicationSchemaKey, serviceBindingSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { GetAllAppsInSpace } from '../../../../store/actions/space.actions';
import { ServicesService } from '../../services.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetApp, SetServiceInstanceGuid } from '../../../../store/actions/create-service-instance.actions';
import { CreateServiceBinding } from '../../../../store/actions/service-bindings.actions';
import { selectRequestInfo } from '../../../../store/selectors/api.selectors';
import { MatSnackBar } from '@angular/material';
import { RouterNav } from '../../../../store/actions/router.actions';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})
export class BindAppsStepComponent implements OnInit, OnDestroy, AfterContentInit {
  validate: Observable<boolean>;
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  allAppsSubscription: Subscription;
  apps$: Observable<APIResource<IApp>[]>;
  // selectedAppGuid: string;
  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
      params: new FormControl(''),
    });

    this.allAppsSubscription = this.store.select(selectCreateServiceInstance).pipe(
      filter(selectCreateServiceInstance => !!selectCreateServiceInstance.spaceGuid),
      tap(createServiceInstanceState => {
        const paginationKey = createEntityRelationPaginationKey(spaceSchemaKey, createServiceInstanceState.spaceGuid);
        this.apps$ = getPaginationObservables<APIResource<IApp>>({
          store: this.store,
          action: new GetAllAppsInSpace(this.servicesService.cfGuid, createServiceInstanceState.spaceGuid, paginationKey),
          paginationMonitor: this.paginationMonitorFactory.create(
            paginationKey,
            entityFactory(applicationSchemaKey)
          )
        }, true).entities$;

        this.serviceInstanceGuid = createServiceInstanceState.serviceInstanceGuid;

      })
    ).subscribe();

  }

  ngOnInit() {
  }

  ngAfterContentInit() {
    this.validate = this.stepperForm.statusChanges
      .map(() => {
        return this.stepperForm.valid;
      });
  }

  submit = () => {
    return this.createBinding().pipe(
      filter(s => !s.creating),
      map(s => {
        if (s.error) {
          this.displaySnackBar();
          return { success: false };
        } else {

          this.store.dispatch(new RouterNav({
            path: ['service-catalog',
              this.servicesService.cfGuid,
              this.servicesService.serviceGuid,
              'instances']
          }
          ));
          return { success: true };
        }
      })
    );
  }

  createBinding = () => {

    const appGuid = this.stepperForm.controls.apps.value;

    const guid = `${this.servicesService.cfGuid}-${appGuid}-${this.serviceInstanceGuid}`;
    let params = this.stepperForm.controls.params.value;
    params = params === '' ? null : params;

    this.store.dispatch(new CreateServiceBinding(
      this.servicesService.cfGuid,
      guid,
      appGuid,
      this.serviceInstanceGuid,
      params

    ));

    return this.store.select(selectRequestInfo(serviceBindingSchemaKey, guid));

  }
  setApp = (guid) => this.store.dispatch(new SetApp(guid));

  ngOnDestroy(): void {
    this.allAppsSubscription.unsubscribe();
  }
  private displaySnackBar() {
    this.snackBar.open('Failed to create service binding! ', 'Dismiss');
  }
}
