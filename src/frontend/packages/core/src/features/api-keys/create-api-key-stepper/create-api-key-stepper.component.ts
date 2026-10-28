import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { SignalStepHandle, StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { CopyToClipboardComponent } from '../../../shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { CustomIconComponent } from '../../../shared/components/custom-material/custom-material.component';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '../../../shared/services/tailwind-dialog.service';
import { ApiKeysDataService } from '../api-keys-data.service';

export interface CreateApiKeyData {
  /** Fills Description, for a replacement. */
  comment?: string;
}

type ExpiryChoice = '30' | '90' | '365' | 'date' | 'never';

const DAY_MS = 24 * 60 * 60 * 1000;
// The server refuses an expiry after 2038-01-19T03:14:07Z; a chosen date
// means the end of that local day, so the last pickable day is the 18th.
const LAST_DATE = '2038-01-18';
const MAX_COMMENT = 255;

// A date input's value (yyyy-mm-dd) for a local day.
function localDay(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/**
 * Create an API key: Details (description and expiry), then the Secret,
 * which is shown only here. There is no way back from the Secret step:
 * the key exists, and Previous would not undo it.
 */
@Component({
  selector: 'app-create-api-key-stepper',
  templateUrl: './create-api-key-stepper.component.html',
  standalone: true,
  imports: [SteppersComponent, StepComponent, CopyToClipboardComponent, CustomIconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateApiKeyStepperComponent {
  private readonly keys = inject(ApiKeysDataService);
  private readonly dialogRef = inject<TailwindDialogRef<void>>(TailwindDialogRef);
  private readonly data = inject<CreateApiKeyData>(MAT_DIALOG_DATA);

  readonly maxComment = MAX_COMMENT;
  readonly maxDate = LAST_DATE;
  // Tomorrow, local: a date at the end of today would be gone by tonight.
  readonly minDate = localDay(new Date(Date.now() + DAY_MS));

  readonly close = () => this.dialogRef.close();

  readonly comment = signal(this.data?.comment ?? '');
  readonly choice = signal<ExpiryChoice>('90');
  readonly date = signal('');

  readonly secret = signal('');
  readonly secretShown = signal(false);

  // When the key stops working, or null for Never.
  private expiry(): Date | null {
    const choice = this.choice();
    if (choice === 'never') {
      return null;
    }
    if (choice === 'date') {
      const [y, m, d] = this.date().split('-').map(Number);
      // A chosen date means the end of that local day.
      return new Date(y, m - 1, d, 23, 59, 59);
    }
    return new Date(Date.now() + Number(choice) * DAY_MS);
  }

  /** The expiry in the viewer's zone, shown beside the choice. */
  readonly expiryText = computed(() => {
    const at = this.dateValid() ? this.expiry() : null;
    return at ? `Expires ${at.toLocaleDateString()}` : (this.choice() === 'never' ? 'This key never expires' : '');
  });

  private readonly dateValid = computed(() => {
    if (this.choice() !== 'date') {
      return true;
    }
    const date = this.date();
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date >= this.minDate && date <= this.maxDate;
  });

  readonly detailsHandle: SignalStepHandle = {
    valid: computed(() => {
      const comment = this.comment().trim();
      return comment.length > 0 && comment.length <= MAX_COMMENT && this.dateValid();
    }),
    nextButtonText: signal('Create').asReadonly(),
    submit: async () => {
      const key = await this.keys.create(this.comment().trim(), this.expiry()?.toISOString() ?? null);
      this.secretShown.set(false);
      this.secret.set(key.secret);
    },
  };

  readonly secretHandle: SignalStepHandle = {
    valid: signal(true).asReadonly(),
    disablePrevious: signal(true).asReadonly(),
    hidePrevious: signal(true).asReadonly(),
    hideCloseButton: signal(true).asReadonly(),
    finishButtonText: signal('Done').asReadonly(),
    submit: async () => {
      // The secret leaves the screen with the dialog.
      this.secret.set('');
      this.close();
      return { ignoreSuccess: true };
    },
  };

  onChoice(value: string): void {
    this.choice.set(value as ExpiryChoice);
  }
}
