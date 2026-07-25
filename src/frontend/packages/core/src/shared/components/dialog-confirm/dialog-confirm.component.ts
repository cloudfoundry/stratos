
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { A11yModule } from '@angular/cdk/a11y';
import { MAT_DIALOG_DATA } from '../../services/tailwind-material-replacements';
import { TailwindDialogRef } from '../../services/tailwind-dialog.service';

import { environment } from '../../../environments/environment';
import { ConfirmationDialogConfig, TypeToConfirm } from '../confirmation-dialog.config';

@Component({
  selector: 'app-dialog-confirm',
  templateUrl: './dialog-confirm.component.html',
  styleUrls: ['./dialog-confirm.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    A11yModule
],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DialogConfirmComponent {
  dialogRef = inject<TailwindDialogRef<DialogConfirmComponent>>(TailwindDialogRef);
  data = inject<ConfirmationDialogConfig>(MAT_DIALOG_DATA);

  public textToMatch!: string;

  // Bound via ngModel to the type-to-confirm input
  public matchValue?: string;

  // Bound via ngModel to the optional checkbox (data.checkbox)
  public checkboxChecked = false;

  constructor() {
    const data = this.data;

    const typeToConfirm = data.message as TypeToConfirm;
    if (typeToConfirm && typeToConfirm.textToMatch) {
      this.textToMatch = typeToConfirm.textToMatch;
    }
    this.checkboxChecked = !!data.checkbox?.default;
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  onConfirmClick(): void {
    // Plain `true` when there's no checkbox (existing callers just check
    // truthiness); an object when there is, so the caller can read the choice.
    this.dialogRef.close(this.data.checkbox ? { checkboxChecked: this.checkboxChecked } : true);
  }

  handlePaste($event: ClipboardEvent) {
    if (environment.production) {
      $event.preventDefault();
    }
  }

}
