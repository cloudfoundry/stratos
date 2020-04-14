import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable, of, Subject } from 'rxjs';
import { first, map, tap } from 'rxjs/operators';

import { AppState } from '../../../../../../store/src/app-state';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { getEventFiles } from '../../../../core/browser-helper';
import { ConfirmationDialogConfig } from '../../../../shared/components/confirmation-dialog.config';
import { ConfirmationDialogService } from '../../../../shared/components/confirmation-dialog.service';
import { StepOnNextFunction, StepOnNextResult } from '../../../../shared/components/stepper/step/step.component';
import { RestoreEndpointsService } from '../restore-endpoints.service';


@Component({
  selector: 'app-restore-endpoints',
  templateUrl: './restore-endpoints.component.html',
  styleUrls: ['./restore-endpoints.component.scss'],
  providers: [
    RestoreEndpointsService
  ]
})
export class RestoreEndpointsComponent implements OnInit {

  // Step 1
  fileValid$: Observable<boolean>;
  fileName: string;

  // Step 2
  passwordValid$: Observable<boolean>;
  passwordForm: FormGroup;

  constructor(
    public service: RestoreEndpointsService,
    store: Store<AppState>,
    paginationMonitorFactory: PaginationMonitorFactory,
    private confirmDialog: ConfirmationDialogService,
  ) {

    // const endpoints$ = of([]);
    // this.endpointDataSource = {
    //   isTableLoading$: of(false),
    //   connect: () => endpoints$.pipe(
    //     map(endpoints => endpoints.sort((a, b) => a.name.localeCompare(b.name)))
    //   ),
    //   disconnect: () => { },
    //   trackBy: (index, row) => row.guid
    // };

    this.setupFileStep();

    this.setupPasswordStep();

  }

  setupFileStep() {
    this.fileValid$ = this.service.validFile$;
  }

  setupPasswordStep() {
    this.passwordForm = new FormGroup({
      password: new FormControl('', [Validators.required]),
    });
    this.passwordValid$ = this.passwordForm.statusChanges.pipe(
      map(() => {
        this.service.password = this.passwordForm.controls.password.value;
        return this.passwordForm.valid;
      })
    );
  }

  ngOnInit() {
  }

  onFileChange(event) {
    const files = getEventFiles(event);
    if (!files.length) {
      return;
    }
    const file = files[0];
    console.log(event, file);
    this.service.setFile(file);

    // console.log(files);
    // TODO: RC file load - get content of file
    // TODO: RC file load - validate correct file
    // TODO: RC file load - parse file
    // TODO: RC file load - enable next step


    // const utils = new DeployApplicationFsUtils();
    // utils.handleFileInputSelection(files).pipe(
    //   filter(res => !!res),
    //   first()
    // ).subscribe((res) => {
    //   this.propagateChange(res);
    //   this.sourceData$.next(res);
    // });
  }

  restore: StepOnNextFunction = () => {
    const confirmation = new ConfirmationDialogConfig(
      'Restore',
      'This will overwrite any matching endpoints and connection details',
      'Continue',
      true
    );
    const result = new Subject<StepOnNextResult>();

    const userCancelledDialog = () => {
      result.next({
        success: false
      });
    };

    const restoreSuccess = data => {
      result.next({
        success: true,
        redirect: true,
      });
    };

    const backupFailure = err => {
      const errorMessage = this.service.createError(err);
      result.next({
        success: false,
        message: `Failed to restore backup` + (errorMessage ? `: ${errorMessage}` : '')
      });
      return of(false);
    };
    // TODO: RC make generic in base

    const createBackup = () => this.service.restoreBackup().pipe(first()).subscribe(restoreSuccess, backupFailure);

    // TODO: RC tie in progress indicator (not sure if possible)
    this.confirmDialog.openWithCancel(confirmation, createBackup, userCancelledDialog);

    // TODO: RC Remove console.log
    return result.asObservable().pipe(tap(console.log));
  }

}
