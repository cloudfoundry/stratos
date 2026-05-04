import { CommonModule } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { MAT_DIALOG_DATA, TailwindDialogRef } from '@stratosui/core';

import { StratosJobError } from '../../../../services/async-jobs/async-job.types';
import {
  RevisionsService,
  RevisionRow,
} from '../../../services/revisions.service';

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
        // UNKNOWN — caller refetches; treat as success close
        this.ref.close({ ok: true, stateChanged: true });
      }
    } catch (err: unknown) {
      if (err instanceof StratosJobError) {
        this.errorMessage.set(
          err.job?.errors?.[0]?.message ?? 'Rollback failed',
        );
      } else {
        this.errorMessage.set('Rollback failed');
      }
    } finally {
      this.inFlight.set(false);
    }
  }

  cancel(): void {
    this.ref.close({ ok: false, stateChanged: false });
  }
}
