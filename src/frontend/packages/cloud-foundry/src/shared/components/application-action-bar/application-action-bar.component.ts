import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';

import {
  PageSubNavComponent,
  PageSubNavSectionComponent,
} from '@stratosui/core';
import { ActionState } from '@stratosui/store';

import { UpdateExistingApplication } from '../../../actions/application.actions';
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
 * Template was extracted verbatim from build-tab.component.html (lines 1-58
 * pre-extraction) so the rendered output on the Summary tab is byte-equivalent
 * to before this refactor.
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
export class AppApplicationActionBarComponent implements OnInit {
  applicationService = inject(ApplicationService);
  actions = inject(AppApplicationActionsService);

  public isBusyUpdating$!: Observable<{ updating: boolean }>;
  public manageAppPermission = CfCurrentUserPermissions.APPLICATION_MANAGE;

  ngOnInit() {
    // Default to NOT busy. The lifecycle path uses writeWithJob (no ngrx
    // dispatch), so updatingSection$.restaging is never set or cleared.
    // Starting busy=true left the buttons stranded after restage because
    // nothing emits a non-busy state until an unrelated ngrx GET happens
    // to fire. Trust "not busy" by default; the runLifecycleAction
    // snackbar gives the operator the visible in-flight signal instead.
    this.isBusyUpdating$ = this.applicationService.entityService.updatingSection$.pipe(
      map(updatingSection => {
        const updating = this.updatingSectionBusy(updatingSection.restaging) ||
          this.updatingSectionBusy(updatingSection[UpdateExistingApplication.updateKey]);
        return { updating };
      }),
      startWith({ updating: false })
    );
  }

  private updatingSectionBusy(section: ActionState) {
    return section && section.busy;
  }
}
