import { Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild, ChangeDetectionStrategy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';

import {
  AppInputDirective,
  CardStatusComponent,
  ConfirmationDialogConfig,
  ConfirmationDialogService,
  CurrentUserPermissionsService,
  CustomFormFieldComponent,
  TailwindSnackBarRef,
  TailwindSnackBarService
} from '@stratosui/core';
import { StratosStatus } from '@stratosui/store';
import { cfEntityCatalog } from '../../../../cf-entity-catalog';
import { ApplicationService } from '../../../../features/applications/application.service';
import { CfAppsSignalConfigService } from '../../list/list-types/app/cf-apps-signal-config.service';
import { CfCurrentUserPermissions } from '../../../../user-permissions/cf-user-permissions-checkers';
import { RunningInstancesComponent } from '../../running-instances/running-instances.component';

const appInstanceScaleToZeroConfirmation = new ConfirmationDialogConfig('Set Instance count to 0',
  'Are you sure you want to set the instance count to 0?', 'Confirm', true);

@Component({
  selector: 'app-card-app-instances',
  templateUrl: './card-app-instances.component.html',
  styleUrls: ['./card-app-instances.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    AppInputDirective,
    CustomFormFieldComponent,
    CardStatusComponent,
    RunningInstancesComponent
  ]
})
export class CardAppInstancesComponent implements OnInit, OnDestroy {
  appService = inject(ApplicationService);
  private apps = inject(CfAppsSignalConfigService);
  private renderer = inject(Renderer2);
  private confirmDialog = inject(ConfirmationDialogService);
  private snackBar = inject(TailwindSnackBarService);


  // Should the card show the actions to scale/down the number of instances?
  @Input() showActions = false;

  @Input() busy: any;

  @ViewChild('instanceField', { static: true }) instanceField!: ElementRef;

  status$: Observable<StratosStatus>;

  public canEditApp$: Observable<boolean>;

  constructor() {
    const appService = this.appService;
    const cups = inject(CurrentUserPermissionsService);

    this.status$ = this.appService.applicationState$.pipe(
      map(state => state.indicator)
    );
    this.canEditApp$ = combineLatest(
      appService.appOrg$,
      appService.appSpace$
    ).pipe(
      switchMap(([org, space]) =>
        cups.can(CfCurrentUserPermissions.APPLICATION_EDIT, appService.cfGuid, org.metadata.guid, space.metadata.guid)
      ));

  }

  private currentCount = 0;
  public editCount = 0;

  private sub!: Subscription;

  public isEditing = false;

  public editValue: any;

  // Observable on the running instances count for the application
  public runningInstances$!: Observable<number>;

  private snackBarRef!: TailwindSnackBarRef<any>;

  ngOnInit() {
    this.sub = this.appService.application$.subscribe(app => {
      if (app.app.entity) {
        this.currentCount = app.app.entity.instances;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
  }

  scaleUp(_current: number) {
    this.setInstanceCount(this.currentCount + 1);
  }

  scaleDown(_current: number) {
    this.setInstanceCount(this.currentCount - 1);
  }

  edit() {
    this.editValue = this.currentCount;
    this.isEditing = true;
    setTimeout(() => {
      this.instanceField.nativeElement.focus();
    }, 0);
  }

  finishEdit(ok: boolean) {
    this.isEditing = false;
    if (ok) {
      this.setInstanceCount(parseInt(this.editValue, 10));
    }
  }

  // Set instance count. Ask for confirmation if setting count to 0
  private setInstanceCount(value: number) {
    const doUpdate = async () => {
      try {
        await this.apps.scaleApp(this.appService.cfGuid, this.appService.appGuid, { instances: value });
        // Legacy updateApplication([STATS]) also triggered appStats.getMultiple
        // so the Instances tab's per-instance table would reflect the new
        // container count. The signal-native scaleApp path skips ngrx
        // entirely, so we need to dispatch the stats refresh explicitly —
        // otherwise the newly-created (or torn-down) instances stay frozen
        // at whatever state the last fetch saw.
        cfEntityCatalog.appStats.actions.getMultiple(this.appService.appGuid, this.appService.cfGuid);
      } catch (err: any) {
        this.snackBarRef = this.snackBar.open(`Failed to update instance count: ${err?.message ?? err}`, 'Dismiss');
      }
    };
    if (value === 0) {
      this.confirmDialog.open(appInstanceScaleToZeroConfirmation, doUpdate);
    } else {
      doUpdate();
    }
  }
}
