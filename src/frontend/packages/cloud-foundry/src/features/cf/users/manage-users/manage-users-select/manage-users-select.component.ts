import {
  ChangeDetectionStrategy,
  Component,
  Signal,
  WritableSignal,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';

import { SignalListComponent, SignalListConfig, StepOnNextResult } from '@stratosui/core';

import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import {
  CfSelectUsersSignalConfigService,
} from '../../../../../shared/signal-list-configs/cf-select-users/cf-select-users-signal-config.service';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { EnumerateComponent } from '../../../../../../../core/src/shared/components/enumerate/enumerate.component';

@Component({
  selector: 'app-manage-users-select',
  templateUrl: './manage-users-select.component.html',
  styleUrls: ['./manage-users-select.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EnumerateComponent,
    SignalListComponent,
  ],
  providers: [CfSelectUsersSignalConfigService],
})
export class UsersRolesSelectComponent {
  private rolesData = inject(CfUsersRolesDataService);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private selectConfig = inject(CfSelectUsersSignalConfigService);
  cfRolesService = inject(CfRolesService);

  // SignalListConfig backing the wizard's user-pick step. Built once at
  // construction and rendered via <app-signal-list>.
  readonly listConfig: WritableSignal<SignalListConfig<StUser>>;

  // The wizard's selection set, derived from the signal-config's
  // selectedKeys + users() each tick.
  readonly selectedUsers: Signal<StUser[]> = computed(() => this.selectConfig.resolveSelected());

  readonly valid$ = signal<boolean>(false);

  constructor() {
    this.listConfig = signal(this.selectConfig.buildConfig());

    // Mirror selection length into valid$ so the wizard's Next gate
    // enables only when at least one user is picked.
    effect(() => {
      this.valid$.set(this.selectedUsers().length > 0);
    });
  }

  async onNext(): Promise<StepOnNextResult> {
    const users = this.selectedUsers();
    this.rolesData.setUsers(this.activeRouteCfOrgSpace.cfGuid, users);
    return { success: true };
  }
}
