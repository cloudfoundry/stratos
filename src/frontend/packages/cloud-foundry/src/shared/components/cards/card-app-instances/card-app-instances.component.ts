import { Component, ElementRef, Input, OnDestroy, OnInit, Renderer2, ViewChild , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { combineLatest, Observable, Subscription } from 'rxjs';
import { first, map, switchMap } from 'rxjs/operators';

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
import { AppMetadataTypes } from '../../../../actions/app-metadata.actions';
import { ApplicationService } from '../../../../features/applications/application.service';
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
    AppInputDirective,
    CustomFormFieldComponent,
    CardStatusComponent,
    RunningInstancesComponent
  ]
})
export class CardAppInstancesComponent implements OnInit, OnDestroy {

  // Should the card show the actions to scale/down the number of instances?
  @Input() showActions = false;

  @Input() busy: any;

  @ViewChild('instanceField', { static: true }) instanceField!: ElementRef;

  status$: Observable<StratosStatus>;

  public canEditApp$: Observable<boolean>;

  constructor(
    public appService: ApplicationService,
    private renderer: Renderer2,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: TailwindSnackBarService,
    cups: CurrentUserPermissionsService
  ) {
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

  private app: any;
  private snackBarRef!: TailwindSnackBarRef<any>;

  ngOnInit() {
    this.sub = this.appService.application$.subscribe(app => {
      if (app.app.entity) {
        this.currentCount = app.app.entity.instances;
        this.app = app.app.entity;
      }
    });
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
    }
  }

  scaleUp(current: number) {
    this.setInstanceCount(this.currentCount + 1);
  }

  scaleDown(current: number) {
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
    const doUpdate = () => this.appService.updateApplication({ instances: value }, [AppMetadataTypes.STATS], this.app);
    if (value === 0) {
      this.confirmDialog.open(appInstanceScaleToZeroConfirmation, doUpdate);
    } else {
      doUpdate().pipe(
        first(),
      ).subscribe(actionState => {
        if (actionState.error) {
          this.snackBarRef = this.snackBar.open(`Failed to update instance count: ${actionState.message}`, 'Dismiss');
        }
      });
    }
  }
}
