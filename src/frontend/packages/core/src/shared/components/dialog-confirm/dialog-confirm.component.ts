import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatDialogModule } from '@angular/material/dialog';
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
    CommonModule,
    FormsModule,
    MatDialogModule,
    A11yModule
  ]
})
export class DialogConfirmComponent {
  public textToMatch: string;

  constructor(
    @Inject('TailwindDialogRef') public dialogRef: TailwindDialogRef<DialogConfirmComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ConfirmationDialogConfig
  ) {
    const typeToConfirm = data.message as TypeToConfirm;
    if (typeToConfirm && typeToConfirm.textToMatch) {
      this.textToMatch = typeToConfirm.textToMatch;
    }
  }

  onNoClick(): void {
    this.dialogRef.close();
  }

  handlePaste($event) {
    if (environment.production) {
      $event.preventDefault();
    }
  }

}
