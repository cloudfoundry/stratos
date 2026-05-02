import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { map } from 'rxjs/operators';

import {
  PageSubNavComponent,
  PageSubNavSectionComponent,
} from '@stratosui/core';

import { ApplicationService } from '../../../features/applications/application.service';
import { ApplicationPollComponent } from '../../../features/applications/application/application-tabs-base/application-poll/application-poll.component';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CfUserPermissionDirective } from '../../directives/cf-user-permission/cf-user-permission.directive';
import { AppApplicationActionsService } from '../../services/application-actions.service';

/**
 * AppApplicationActionBarComponent
 *
 * Shared action bar (start/stop/restart/restage/edit/delete + visit + poll)
 * for the application detail pages. Hosted once at application-tabs-base so
 * every tab (Summary, Variables, Events, Routes, Services, Log Stream,
 * Instances, Metrics, Git SCM) shows the same controls.
 *
 * The busy state used to read from ngrx updatingSection$.restaging — that
 * was driven by pre-writeWithJob dispatch paths and could persist
 * busy=true across reloads via localStorage hydration, stranding the
 * buttons permanently. The action service now owns its own inFlight
 * signal so external state can never strand the buttons.
 */
@Component({
  selector: 'app-application-action-bar',
  templateUrl: './application-action-bar.component.html',
  styleUrls: ['./application-action-bar.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    PageSubNavSectionComponent,
    CfUserPermissionDirective,
    ApplicationPollComponent,
  ],
  providers: [AppApplicationActionsService],
})
export class AppApplicationActionBarComponent {
  applicationService = inject(ApplicationService);
  actions = inject(AppApplicationActionsService);

  // Adapt the action service's inFlight signal back to the
  // {updating: boolean} shape the existing template binding expects.
  isBusyUpdating$ = toObservable(this.actions.inFlight).pipe(
    map(inFlight => ({ updating: inFlight })),
  );
  manageAppPermission = CfCurrentUserPermissions.APPLICATION_MANAGE;
}
