import { Component, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '../../../shared/services/tailwind-material-replacements';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { entityCatalog, stratosEntityCatalog, NormalizedResponse, ApiKey, RequestInfoState } from '@stratosui/store';
import { BehaviorSubject, Subscription } from 'rxjs';
import { filter, first, map, pairwise, tap } from 'rxjs/operators';

import { safeUnsubscribe } from '../../../core/utils.service';
import { DialogErrorComponent } from '../../../shared/components/dialog-error/dialog-error.component';

@Component({
  selector: 'app-add-api-key-dialog',
  templateUrl: './add-api-key-dialog.component.html',
  styleUrls: ['./add-api-key-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    DialogErrorComponent
  ]
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
    @Inject('TailwindDialogRef') public dialogRef: MatDialogRef<ApiKey>,
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
