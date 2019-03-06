import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { map, first, filter } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { AppState } from '../../../../../../store/src/app-state';
import { ApplicationService } from '../../../../features/applications/application.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';
import { EntityService } from '../../../../core/entity-service';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import {
  entityFactory,
  appAutoscalerPolicySchemaKey,
} from '../../../../../../store/src/helpers/entity-factory';
import { GetAppAutoscalerPolicyAction, UpdateAppAutoscalerPolicyAction } from '../../../../../../store/src/actions/app-autoscaler.actions';
import { AppAutoscalerPolicy } from '../../../../../../store/src/types/app-autoscaler.types';
import { selectUpdateInfo } from '../../../../../../store/src/selectors/api.selectors';
import { ActionState } from '../../../../../../store/src/reducers/api-request-reducer/types';
import { CardStatus } from '../../../shared.types';

@Component({
  selector: 'app-card-autoscaler-default',
  templateUrl: './card-autoscaler-default.component.html',
  styleUrls: ['./card-autoscaler-default.component.scss']
})
export class CardAutoscalerDefaultComponent implements OnInit, OnDestroy {

  @ViewChild('instanceField') instanceField: ElementRef;

  constructor(
    public appService: ApplicationService,
    private store: Store<AppState>,
    private snackBar: MatSnackBar,
    private entityServiceFactory: EntityServiceFactory,
    private applicationService: ApplicationService,
  ) {
    this.status$ = this.appService.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

  status$: Observable<CardStatus>;
  appAutoscalerPolicyService: EntityService;
  appAutoscalerPolicyUpdateService: EntityService;
  public appAutoscalerPolicy$: Observable<AppAutoscalerPolicy>;

  currentPolicy = {
    instance_min_count: 0,
    instance_max_count: 0
  };
  public isEditing = false;
  public instanceMinCountCurrent: number;
  public instanceMinCountEdit: number;
  public instanceMaxCountCurrent: any;
  public instanceMaxCountEdit: any;

  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

  ngOnInit() {
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
        }
        return entity && entity.entity;
      })
    );
  }

  ngOnDestroy(): void {
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
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

}
