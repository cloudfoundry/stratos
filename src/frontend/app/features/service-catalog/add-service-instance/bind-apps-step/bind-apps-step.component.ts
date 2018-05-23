import { AfterContentInit, Component, OnDestroy, Input } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { MatSnackBar } from '@angular/material';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, filter, first, map, tap, switchMap } from 'rxjs/operators';
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
  selectCreateServiceInstance,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { appDataSort } from '../../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { SpecifyDetailsStepComponent } from '../specify-details-step/specify-details-step.component';
import { CsiGuidsService } from '../csi-guids.service';

@Component({
  selector: 'app-bind-apps-step',
  templateUrl: './bind-apps-step.component.html',
  styleUrls: ['./bind-apps-step.component.scss']
})

export class BindAppsStepComponent implements OnDestroy, AfterContentInit {

  @Input('boundAppId')
  boundAppId: string;

  validateSubscription: Subscription;
  validate = new BehaviorSubject(true);
  serviceInstanceGuid: string;
  stepperForm: FormGroup;
  allAppsSubscription: Subscription;
  apps$: Observable<APIResource<IApp>[]>;
  guideText = 'Specify the application to bind (Optional)';
  haveApps = false;
  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private snackBar: MatSnackBar,
    private csiGuidsService: CsiGuidsService
  ) {
    this.stepperForm = new FormGroup({
      apps: new FormControl(''),
      params: new FormControl('', SpecifyDetailsStepComponent.isValidJsonValidatorFn()),
    });
  }


  private fetchApps() {
    this.allAppsSubscription = this.apps$.pipe(
      map(apps => {
        if (this.boundAppId) {
          return apps.filter(a => a.metadata.guid === this.boundAppId);
        }
        return apps;
      }),
      map(apps => apps.sort(appDataSort)),
      first(),
      map(apps => apps.slice(0, 50)),
      tap(apps => {
        if (apps.length > 0) {
          this.haveApps = true;
        }
        if (this.boundAppId) {
          this.stepperForm.controls.apps.setValue(this.boundAppId);
          this.stepperForm.controls.apps.disable();
          this.guideText = 'Specify binding params (optional)';
        }
      }
      )
    ).subscribe();
  }
  private getApps(cfGuid: string, spaceGuid: string, paginationKey: string) {
    return getPaginationObservables<APIResource<IApp>>({
      store: this.store,
      action: new GetAllAppsInSpace(cfGuid, spaceGuid, paginationKey),
      paginationMonitor: this.paginationMonitorFactory.create(paginationKey, entityFactory(applicationSchemaKey))
    }, true).entities$;
  }

  ngAfterContentInit() {
    this.validateSubscription = this.stepperForm.statusChanges
      .map(() => {
        if (this.stepperForm.pristine) {
          setTimeout(() => this.validate.next(true));
        }
        setTimeout(() => this.validate.next(this.stepperForm.valid));
      }).subscribe();


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
    this.fetchApps();
  }

  submit = () => {
    this.setApp();
    return Observable.of({ success: true });
  }

  setApp = () => this.store.dispatch(
    new SetCreateServiceInstanceApp(this.stepperForm.controls.apps.value, this.stepperForm.controls.params.value)
  )

  ngOnDestroy(): void {
    this.allAppsSubscription.unsubscribe();
    this.validateSubscription.unsubscribe();
  }
  private displaySnackBar() {
    this.snackBar.open('Failed to create service binding! ', 'Dismiss');
  }

}
