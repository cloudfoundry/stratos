import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { CommonModule } from '@angular/common';

import { JobStage } from '../../../services/async-jobs/async-job.types';

interface DisplayStage extends JobStage {
  status: 'done' | 'now' | 'pending';
}

@Component({
  selector: 'app-stage-row',
  standalone: true,
  imports: [CommonModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-stage-row.component.html',
})
export class AppStageRowComponent {
  readonly stages = input<JobStage[]>([]);
  // True while the lifecycle op is still in flight. When false (success or
  // fail terminal state), the final received stage is marked 'done' instead
  // of 'now' — without this, a backend job that resolves before its last
  // stage clears (e.g. restage's "Waiting for instances" — the job
  // resolves on CF acceptance, not on instance steady-state) leaves the
  // stage row visually pulsing forever in the snackbar's linger window.
  readonly inFlight = input<boolean>(true);

  readonly display = computed<DisplayStage[]>(() => {
    const arr = this.stages();
    if (!arr.length) return [];

    const lastIsActive = this.inFlight();
    const out: DisplayStage[] = arr.map((s, i) => ({
      ...s,
      status: (i < arr.length - 1 || !lastIsActive) ? 'done' : 'now',
    }));

    // Synthesize pending placeholders when the last stage's `of` count
    // exceeds the number of stages we have received so far. Only render
    // placeholders while in flight — once the op terminates, missing
    // stages are pretend-completed (they didn't happen, but the row
    // shouldn't continue to display open dots).
    const last = arr[arr.length - 1];
    if (lastIsActive && last && last.of > arr.length) {
      for (let i = arr.length; i < last.of; i++) {
        out.push({
          code: `__pending_${i}`,
          label: '',
          index: i + 1,
          of: last.of,
          enteredAt: '',
          status: 'pending',
        });
      }
    }

    return out;
  });

  glyph(s: DisplayStage): string {
    if (s.status === 'done') return '✓';
    if (s.status === 'now')  return '●';
    return '○';
  }

  classes(s: DisplayStage): string {
    if (s.status === 'done') return 'text-success';
    if (s.status === 'now')  return 'text-warning font-bold animate-pulse';
    return 'text-content-muted';
  }
}
