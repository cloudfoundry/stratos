import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Http } from '@angular/http';
import { ErrorStateMatcher, ShowOnDirtyErrorStateMatcher } from '@angular/material';
import { Store } from '@ngrx/store';
import { Observable, of as observableOf, Subscription } from 'rxjs';
import { filter, map, take, first } from 'rxjs/operators';

import { StepOnNextFunction } from '../../../shared/components/stepper/step/step.component';
import { AppMetadataTypes } from '../../../store/actions/app-metadata.actions';
import { SetCFDetails, SetNewAppName } from '../../../store/actions/create-applications-page.actions';
import { AppState } from '../../../store/app-state';
import { AppNameUniqueChecking, AppNameUniqueDirective } from '../app-name-unique.directive/app-name-unique.directive';
import { ApplicationService } from '../application.service';

import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../core/entity-service';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../store/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../store/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../store/types/app-autoscaler.types';
import { selectUpdateInfo } from '../../../store/selectors/api.selectors';
import { ActionState } from '../../../store/reducers/api-request-reducer/types';
import { SourceType } from '../../../store/types/deploy-application.types';
import { MetricTypes, UpperOperators, LowerOperators } from '../../../store/helpers/autoscaler-helpers';

@Component({
  selector: 'app-edit-autoscaler-policy',
  templateUrl: './edit-autoscaler-policy.component.html',
  styleUrls: ['./edit-autoscaler-policy.component.scss'],
  providers: [
    { provide: ErrorStateMatcher, useClass: ShowOnDirtyErrorStateMatcher }
  ]
})
export class EditAutoscalerPolicyComponent implements OnInit, OnDestroy {

  parentUrl = `/applications/${this.applicationService.cfGuid}/${this.applicationService.appGuid}/auto-scaler`;

  scalingRuleColumns: string[] = ['metric', 'condition', 'action'];
  specificDateColumns: string[] = ['from', 'to', 'init', 'min', 'max'];
  recurringScheduleColumns: string[] = ['effect', 'repeat', 'from', 'to', 'init', 'min', 'max'];

  weekdayOptions: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  metricTypes = MetricTypes;
  operatorTypes = UpperOperators.concat(LowerOperators);

  sourceTypes: SourceType[] = [
    { name: 'Public GitHub', id: 'github', group: 'gitscm' },
    { name: 'Public GitLab', id: 'gitlab', group: 'gitscm' },
    { name: 'Public Git URL', id: 'giturl' },
    { name: 'Application Archive File', id: 'file' },
    { name: 'Application Folder', id: 'folder' },
  ];

  editAppForm: FormGroup;

  uniqueNameValidator: AppNameUniqueDirective;

  appNameChecking: AppNameUniqueChecking = new AppNameUniqueChecking();

  constructor(
    public applicationService: ApplicationService,
    private store: Store<AppState>,
    private fb: FormBuilder,
    private http: Http,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory,
  ) {
    this.uniqueNameValidator = new AppNameUniqueDirective(this.store, this.http);
    this.editAppForm = this.fb.group({
      instance_min_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
      instance_max_count: [0, [
        Validators.required,
        Validators.min(1)
      ]],
    });
  }

  private app: any = {
    entity: {}
  };

  private sub: Subscription;

  private error = false;

  appAutoscalerPolicyService: EntityService;
  appAutoscalerPolicyUpdateService: EntityService;
  public appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  private currentPolicy: any;
  public isEditing = false;
  public instanceMinCountCurrent: number;
  public instanceMinCountEdit: number;
  public instanceMaxCountCurrent: any;
  public instanceMaxCountEdit: any;

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  updateApp: StepOnNextFunction = () => {
    const updates = {};
    // We will only send the values that were actually edited
    for (const key of Object.keys(this.editAppForm.value)) {
      if (!this.editAppForm.controls[key].pristine) {
        updates[key] = this.editAppForm.value[key];
      }
    }

    let obs$: Observable<any>;
    if (Object.keys(updates).length) {
      // We had at least one value to change - send update action
      obs$ = this.applicationService.updateApplication(updates, [AppMetadataTypes.SUMMARY]).pipe(map(v => (
        {
          success: !v.error,
          message: `Could not update application: ${v.message}`
        })));
    } else {
      obs$ = observableOf({ success: true });
    }

    return obs$.pipe(take(1), map(res => {
      return {
        ...res,
        redirect: res.success
      };
    }));
  }

  clearSub() {
    if (this.sub) {
      this.sub.unsubscribe();
      this.sub = undefined;
    }
  }

  ngOnInit() {
    this.sub = this.applicationService.application$.pipe(
      filter(app => !!app.app.entity),
      take(1),
      map(app => app.app.entity)
    ).subscribe(app => {
      this.app = app;
      this.store.dispatch(new SetCFDetails({
        cloudFoundry: this.applicationService.cfGuid,
        org: '',
        space: this.app.space_guid,
      }));
      this.store.dispatch(new SetNewAppName(this.app.name));
      // Don't want the values to change while the user is editing
      this.clearSub();
    });

    this.appAutoscalerPolicyService = this.entityServiceFactory.create(
      appAutoscalerPolicySchemaKey,
      entityFactory(appAutoscalerPolicySchemaKey),
      this.applicationService.appGuid,
      new GetAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid),
      false
    );
    this.appAutoscalerPolicy$ = this.appAutoscalerPolicyService.entityObs$.pipe(
      map(({ entity }) => {
        if (entity && entity.entity) {
          this.instanceMinCountCurrent = entity.entity.instance_min_count;
          this.instanceMaxCountCurrent = entity.entity.instance_max_count;
          this.currentPolicy = entity.entity;
          this.editAppForm.setValue({
            instance_min_count: this.currentPolicy.instance_min_count,
            instance_max_count: this.currentPolicy.instance_max_count,
          });
        }
        return entity && entity.entity;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
    this.clearSub();
  }

  edit() {
    this.instanceMinCountEdit = this.instanceMinCountCurrent;
    this.instanceMaxCountEdit = this.instanceMaxCountCurrent;
    this.isEditing = true;
  }

  finishEdit(ok: boolean) {
    this.isEditing = false;
    this.currentPolicy.instance_min_count = this.instanceMinCountEdit;
    this.currentPolicy.instance_max_count = this.instanceMaxCountEdit;
    if (ok) {
      const doUpdate = () => this.updatePolicy();
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.snackBarRef = this.snackBar.open(`Failed to update instance count: ${actionState.message}`, 'Dismiss');
        }
      });
    }
  }

  updatePolicy(): Observable<ActionState> {
    this.store.dispatch(
      new UpdateAppAutoscalerPolicyAction(this.applicationService.appGuid, this.applicationService.cfGuid, this.currentPolicy)
    );
    const actionState = selectUpdateInfo(appAutoscalerPolicySchemaKey,
      this.applicationService.appGuid,
      UpdateAppAutoscalerPolicyAction.updateKey);
    return this.store.select(actionState).pipe(filter(item => !!item));
  }

  remove() {
    // console.log('remove')
  }
}
