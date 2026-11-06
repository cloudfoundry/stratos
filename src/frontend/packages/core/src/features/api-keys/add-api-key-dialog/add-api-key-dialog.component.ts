import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ApiKey } from '@stratosui/store';

import { AppInputDirective, CustomFormFieldComponent } from '../../../shared/components/custom-form-field/custom-form-field.component';
import { DialogErrorComponent } from '../../../shared/components/dialog-error/dialog-error.component';
import { AppProgressBarComponent } from '../../../shared/components/progress-bar/app-progress-bar.component';
import { TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysDataService } from '../api-keys-data.service';

interface AddApiKeyForm {
  comment: FormControl<string>;
}

@Component({
  selector: 'app-add-api-key-dialog',
  templateUrl: './add-api-key-dialog.component.html',
  styleUrls: ['./add-api-key-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    AppInputDirective,
    CustomFormFieldComponent,
    AppProgressBarComponent,
    DialogErrorComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddApiKeyDialogComponent {
  private fb = inject(FormBuilder);
  private dataService = inject(ApiKeysDataService);
  dialogRef = inject<TailwindDialogRef<ApiKey>>('TailwindDialogRef' as any);

  public hasErrored = signal<string | null>(null);
  public isBusy = signal<boolean>(false);

  public formGroup: FormGroup<AddApiKeyForm>;

  constructor() {
    this.formGroup = this.fb.group<AddApiKeyForm>({
      comment: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    });
  }

  async submit(): Promise<void> {
    this.isBusy.set(true);
    this.hasErrored.set(null);
    try {
      const created = await this.dataService.create(this.formGroup.controls.comment.value);
      this.dialogRef.close(created);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.hasErrored.set(`Failed to create key: ${message}`);
      this.isBusy.set(false);
    }
  }
}
