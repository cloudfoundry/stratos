import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, OnDestroy, OnInit, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { RouterModule } from '@angular/router';
import { combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import {
  PageSubNavComponent,
  PageSubNavSectionComponent,
} from '@stratosui/core';

import { ApplicationService } from '../../../features/applications/application.service';
import { activeTabKey } from '../../active-tab-key';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { CfUserPermissionDirective } from '../../directives/cf-user-permission/cf-user-permission.directive';
import { AppApplicationActionsService } from '../../services/application-actions.service';
import { AppLifecycleProgressService } from '../app-lifecycle-progress/app-lifecycle-progress.service';
import { APPLICATION_CLI_COMMANDS, CliCommandNames, commandsForTab } from '../cli-info/cli-commands';
import { CliMenuComponent } from '../cli-menu/cli-menu.component';

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
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
    PageSubNavComponent,
    PageSubNavSectionComponent,
    CfUserPermissionDirective,
    CliMenuComponent,
  ],
  // AppApplicationActionsService is now provided at ApplicationTabsBaseComponent
  // level so the BuildTab status card can read its inFlight signal too (for
  // the in-flight pulse animation). No providers here — the action bar reads
  // the parent-provided instance.
})
export class AppApplicationActionBarComponent implements OnInit, OnDestroy {
  applicationService = inject(ApplicationService);
  actions = inject(AppApplicationActionsService);
  private host = inject(ElementRef);
  private progressSvc = inject(AppLifecycleProgressService);

  // Read the action service's inFlight signal directly in the template via
  // this getter. The previous toObservable(actions.inFlight) + async-pipe
  // outer guard added one microtask of delay before the whole action bar
  // would render on every page load — visible "actions lag" reported on
  // adepttech dev.84. Signal reads in templates resolve synchronously, so
  // the bar appears with the rest of the page header.
  get isBusy(): boolean { return this.actions.inFlight(); }
  manageAppPermission = CfCurrentUserPermissions.APPLICATION_MANAGE;

  // The CF CLI menu: the commands of the open tab, with the names filled in.
  private activeTab = activeTabKey();
  readonly cliCommands = computed(() => commandsForTab(APPLICATION_CLI_COMMANDS, this.activeTab()));
  readonly cliNames = toSignal(combineLatest([
    this.applicationService.application$,
    this.applicationService.appOrg$,
    this.applicationService.appSpace$,
  ]).pipe(map(([app, org, space]): CliCommandNames => ({
    appName: app?.app?.entity?.name,
    orgName: org?.name ?? '',
    spaceName: space?.name ?? '',
  }))), { initialValue: { orgName: '', spaceName: '' } as CliCommandNames });
  readonly cliAllLink = ['/applications', this.applicationService.cfGuid, this.applicationService.appGuid, 'cli'];

  ngOnInit(): void {
    this.progressSvc.setAnchor(this.host);
  }

  ngOnDestroy(): void {
    this.progressSvc.setAnchor(null);
  }
}
