import { Component, ElementRef, Input, OnDestroy, OnInit, Renderer, ViewChild } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { map, first, tap } from 'rxjs/operators';

import { ApplicationService } from '../../../../features/applications/application.service';
import { AppMetadataTypes } from '../../../../store/actions/app-metadata.actions';
import { ConfirmationDialogConfig } from '../../confirmation-dialog.config';
import { ConfirmationDialogService } from '../../confirmation-dialog.service';
import { CardStatus } from './../../application-state/application-state.service';
import { MatSnackBar, MatSnackBarRef, SimpleSnackBar } from '@angular/material';

const appInstanceScaleToZeroConfirmation = new ConfirmationDialogConfig('Set Instance count to 0',
  'Are you sure you want to set the instance count to 0?', 'Confirm', true);

@Component({
  selector: 'app-card-app-instances',
  templateUrl: './card-app-instances.component.html',
  styleUrls: ['./card-app-instances.component.scss']
})
export class CardAppInstancesComponent implements OnInit, OnDestroy {

  // Should the card show the actions to scale/down the number of instances?
  @Input() showActions = false;

  @Input() busy: any;

  @ViewChild('instanceField') instanceField: ElementRef;

  status$: Observable<CardStatus>;

  constructor(
    public appService: ApplicationService,
    private renderer: Renderer,
    private confirmDialog: ConfirmationDialogService,
    private snackBar: MatSnackBar) {
    this.status$ = this.appService.applicationState$.pipe(
      map(state => state.indicator)
    );
  }

  private currentCount: 0;
  public editCount: 0;

  private sub: Subscription;

  public isEditing = false;

  public editValue: any;

  // Observable on the running instances count for the application
  public runningInstances$: Observable<number>;

  private app: any;
  private snackBarRef: MatSnackBarRef<SimpleSnackBar>;

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
      this.renderer.invokeElementMethod(this.instanceField.nativeElement, 'focus', []);
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
