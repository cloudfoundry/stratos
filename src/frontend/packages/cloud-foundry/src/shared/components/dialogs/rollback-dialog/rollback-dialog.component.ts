import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

import {
  RevisionsService,
  RevisionRow,
} from '../../../services/revisions.service';
import { extractHttpErrorMessage } from '@stratosui/store';
import { unknownHow, unknownOutcomeMessage } from '../../../../services/async-jobs/unknown-outcome-message';

export interface RollbackDialogData {
  revision: RevisionRow;
  cnsi: string;
  appGuid: string;
}

export interface RollbackDialogResult {
  ok: boolean;
  stateChanged: boolean;
}

@Component({
  selector: 'app-rollback-dialog',
  templateUrl: './rollback-dialog.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule],
})
export class RollbackDialogComponent {
  private svc = inject(RevisionsService);
  private ref = inject<TailwindDialogRef<RollbackDialogComponent, RollbackDialogResult>>(TailwindDialogRef);
  data = inject<RollbackDialogData>(MAT_DIALOG_DATA);

  inFlight = signal(false);
  errorMessage = signal<string | null>(null);
  // Set once a rollback ended with an unknown result: whatever closes the
  // dialog then asks the Revisions tab to re-read.
  private ended = false;

  async confirm(): Promise<void> {
    if (this.inFlight()) {
      return;
    }
    this.inFlight.set(true);
    this.errorMessage.set(null);
    try {
      const r = await this.svc.rollback(
        this.data.cnsi,
        this.data.appGuid,
        this.data.revision.guid,
        { strategy: 'rolling' },
      );
      if (r.status === 'COMPLETE') {
        this.ref.close({ ok: true, stateChanged: true });
      } else {
        // Result unknown: say so rather than close as if it worked.
        this.ended = true;
        this.errorMessage.set(unknownOutcomeMessage(
          `Roll back to revision #${this.data.revision.version}`, 'The Revisions tab', unknownHow(r)));
      }
    } catch (err: unknown) {
      this.errorMessage.set(extractHttpErrorMessage(err));
    } finally {
      this.inFlight.set(false);
    }
  }

  cancel(): void {
    this.ref.close({ ok: false, stateChanged: this.ended });
  }
}
