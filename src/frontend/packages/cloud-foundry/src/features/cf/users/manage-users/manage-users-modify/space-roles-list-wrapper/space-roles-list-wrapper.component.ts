import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  inject,
  signal,
} from '@angular/core';

import {
  SignalListCellTemplateDirective,
  SignalListComponent,
  SignalListConfig,
} from '@stratosui/core';

import { CfRoleCheckboxComponent } from '../../../../../../shared/components/cf-role-checkbox/cf-role-checkbox.component';
import {
  CfUsersSpaceRolesSignalConfigService,
} from '../../../../../../shared/components/list/list-types/cf-users-org-space-roles/cf-users-space-roles-signal-config.service';
import { SpaceUserRoleNames } from '../../../../../../store/types/cf-user.types';
import type { StSpace } from '../../../../../../services/endpoint-data/stratos-types';

// Hosts the signal-native space-roles list for the manage-users wizard.
// Replaces the legacy ListConfig-driven <app-list> with
// <app-signal-list> and projects three CfRoleCheckbox templates into
// kind:'template' columns added in W9.
@Component({
  selector: 'app-space-roles-list-wrapper',
  templateUrl: './space-roles-list-wrapper.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CfRoleCheckboxComponent,
    SignalListCellTemplateDirective,
    SignalListComponent,
  ],
  providers: [CfUsersSpaceRolesSignalConfigService],
})
export class SpaceRolesListWrapperComponent {
  private spacesConfig = inject(CfUsersSpaceRolesSignalConfigService);

  readonly initialised: Signal<boolean> = this.spacesConfig.initialised;
  readonly listConfig: WritableSignal<SignalListConfig<StSpace>>;

  // Surfaced to template — CfRoleCheckbox role enums.
  readonly MANAGER = SpaceUserRoleNames.MANAGER;
  readonly AUDITOR = SpaceUserRoleNames.AUDITOR;
  readonly DEVELOPER = SpaceUserRoleNames.DEVELOPER;

  constructor() {
    this.listConfig = signal(this.spacesConfig.buildConfig());
  }

  orgName(): string {
    return this.spacesConfig.orgName;
  }
}
