import { Component, OnDestroy } from '@angular/core';
import { UntypedFormBuilder, UntypedFormGroup, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { entityCatalog, stratosEntityCatalog, NormalizedResponse, ApiKey, RequestInfoState } from '@stratosui/store';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../core/utils.service';

@Component({
  selector: 'app-add-api-key-dialog',
  templateUrl: './add-api-key-dialog.component.html',
  styleUrls: ['./add-api-key-dialog.component.scss']
})
export class AddApiKeyDialogComponent implements OnDestroy {

  private hasErrored = new BehaviorSubject(null);
  public hasErrored$ = this.hasErrored.asObservable();
  private isBusy = new BehaviorSubject(false);
  public isBusy$ = this.isBusy.asObservable();

  private sub: Subscription;

  public formGroup: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    public dialogRef: MatDialogRef<ApiKey>,
  ) {
    this.formGroup = this.fb.group({
      comment: ['', Validators.required],
    });
  }

  ngOnDestroy(): void {
    safeUnsubscribe(this.sub);
  }

  submit() {
    this.sub = stratosEntityCatalog.apiKey.api.create<RequestInfoState>(this.formGroup.controls.comment.value).pipe(
      tap(() => {
        this.isBusy.next(true);
        this.hasErrored.next(null);
      }),
      pairwise(),
      filter(([oldR, newR]) => oldR.creating && !newR.creating),
      map(([, newR]) => newR),
      tap(state => {
        if (state.error) {
          this.hasErrored.next(`Failed to create key: ${state.message}`);
          this.isBusy.next(false);
        } else {
          const response: NormalizedResponse<ApiKey> = state.response;
          const entityKey = entityCatalog.getEntityKey(stratosEntityCatalog.apiKey.actions.create(''));
          this.dialogRef.close(response.entities[entityKey][response.result[0]]);
        }
      }),
      first()
    ).subscribe();
  }

}
