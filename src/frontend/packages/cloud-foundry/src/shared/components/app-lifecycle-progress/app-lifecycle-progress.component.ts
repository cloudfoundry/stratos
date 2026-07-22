import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppStageRowComponent } from '../app-stage-row/app-stage-row.component';

/**
 * AppLifecycleProgressComponent
 *
 * Presentational snackbar that renders while a lifecycle action
 * (start / stop / restart / restage) is in flight. Driven entirely by
 * AppApplicationActionsService signals — no inputs needed.
 *
 * Mounted into an Angular CDK Overlay by AppLifecycleProgressService
 * rather than placed in a template, so it can float above the page in
 * two positioning modes:
 *   - Anchored to the action bar when the user is on the app detail page
 *   - Pinned to the top-right viewport edge when they navigate away
 */
@Component({
  selector: 'app-lifecycle-progress',
  standalone: true,
  imports: [CommonModule, AppStageRowComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './app-lifecycle-progress.component.html',
})
export class AppLifecycleProgressComponent {
  actions = inject(AppApplicationActionsService);
}
