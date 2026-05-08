import { DatePipe } from '@angular/common';
import { Component, ChangeDetectionStrategy, OnInit, Signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { switchMap } from 'rxjs/operators';

import {
  ListComponent,
  ListConfig,
  ListSubNavAddAction,
  ListSubNavComponent,
  NoContentMessageComponent,
} from '@stratosui/core';
import { RouterNav } from '@stratosui/store';
import {
  AppServiceBindingListConfigService,
} from '../../../../../../shared/components/list/list-types/app-sevice-bindings/app-service-binding-list-config.service';
import { ApplicationService } from '../../../../application.service';
import { AppDetailDataService } from '../../../../app-detail-data.service';
import { CurrentUserPermissionsService } from '@stratosui/core';
import { CfCurrentUserPermissions } from '../../../../../../user-permissions/cf-user-permissions.types';
import { CFAppState } from '../../../../../../cf-app-state';

/**
 * ServicesTabComponent — legacy `<app-list>` with the L5 sub-nav layered
 * above. The list config still owns column/row behavior; the sub-nav owns
 * the create-affordance row (Total + blue "+ Bind Service" button).
 *
 * `[suppressAddButton]` on the list hides the legacy in-toolbar `+`
 * (rendered from `getGlobalActions()`) so the sub-nav doesn't duplicate it.
 * The list config's globalActions stay defined — when this tab eventually
 * migrates off the legacy list, deleting them is a one-liner.
 */
@Component({
  selector: 'app-services-tab',
  templateUrl: './services-tab.component.html',
  styleUrls: ['./services-tab.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    DatePipe,
    {
      provide: ListConfig,
      useClass: AppServiceBindingListConfigService
    }
  ],
  imports: [
    ListComponent,
    ListSubNavComponent,
    NoContentMessageComponent,
  ],
})
export class ServicesTabComponent implements OnInit {
  private readonly dataService = inject(AppDetailDataService);
  private readonly appService = inject(ApplicationService);
  private readonly store = inject<Store<CFAppState>>(Store);
  private readonly permissions = inject(CurrentUserPermissionsService);

  /** Reactive count of attached service bindings — derived from the
   *  signal-native bindings list AppDetailDataService loads from the
   *  /pp/v1/cf/apps/{cnsi}/{app}/service_bindings?return=summary
   *  endpoint. Fixes the L5 sub-nav count bug where the legacy
   *  appDetailToLegacySummary() stubbed `services: []` and the count
   *  always rendered as 0. */
  readonly totalServices: Signal<number> = this.dataService.serviceBindingsCount;

  ngOnInit(): void {
    // Kick off the bindings load on tab mount. Idempotent — re-mounting
    // the tab while already loaded just refreshes; the component-scoped
    // AppDetailDataService keeps results across nav within the same app
    // detail.
    void this.dataService.refresh('serviceBindings');
  }

  /**
   * Permission-gated visibility for the Bind Service action. Mirrors the
   * legacy `listActionAdd.visible$` predicate from
   * AppServiceBindingListConfigService — bindings need
   * SERVICE_INSTANCE_CREATE permission on the app's space.
   */
  private readonly canBindSignal: Signal<boolean> = toSignal(
    this.appService.waitForAppEntity$.pipe(
      switchMap(app => this.permissions.can(
        CfCurrentUserPermissions.SERVICE_INSTANCE_CREATE,
        this.appService.cfGuid,
        app.entity.entity.space_guid,
      )),
    ),
    { initialValue: false },
  );

  readonly bindServiceAction: ListSubNavAddAction = {
    label: 'Bind Service',
    icon: 'add',
    invoke: () => {
      this.store.dispatch(new RouterNav({
        path: ['applications', this.appService.cfGuid, this.appService.appGuid, 'bind'],
      }));
    },
    visible: this.canBindSignal,
  };
}
