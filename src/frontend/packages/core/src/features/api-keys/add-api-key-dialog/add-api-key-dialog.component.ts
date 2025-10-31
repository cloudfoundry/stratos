import { ChangeDetectionStrategy, Component, OnDestroy, Inject, signal  } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UntypedFormBuilder, UntypedFormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { CustomFormFieldComponent } from '../../../shared/components/custom-form-field/custom-form-field.component';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';
import { entityCatalog, stratosEntityCatalog, NormalizedResponse, ApiKey, RequestInfoState } from '@stratosui/store';
import { Subscription } from 'rxjs';
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
    CustomFormFieldComponent,
    AppProgressBarComponent,
    DialogErrorComponent
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AddApiKeyDialogComponent implements OnDestroy {

  public hasErrored = signal<string | null>(null);
  public isBusy = signal<boolean>(false);

  private sub: Subscription;

  public formGroup: UntypedFormGroup;

  constructor(
    private fb: UntypedFormBuilder,
    @Inject('TailwindDialogRef') public dialogRef: TailwindDialogRef<ApiKey>,
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
        this.isBusy.set(true);
        this.hasErrored.set(null);
      }),
      pairwise(),
      filter(([oldR, newR]) => oldR.creating && !newR.creating),
      map(([, newR]) => newR),
      tap(state => {
        if (state.error) {
          this.hasErrored.set(`Failed to create key: ${state.message}`);
          this.isBusy.set(false);
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
