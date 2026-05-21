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
import { toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@stratosui/store';
import { Observable, of } from 'rxjs';

import { SignalListComponent, SignalListConfig } from '@stratosui/core';

import { UsersRolesSetUsers } from '../../../../../actions/users-roles.actions';
import { CFAppState } from '../../../../../cf-app-state';
import {
  CfSelectUsersSignalConfigService,
} from '../../../../../shared/components/list/list-types/cf-select-users/cf-select-users-signal-config.service';
import { CfUser } from '../../../../../store/types/cf-user.types';
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
  private store = inject<Store<CFAppState>>(Store);
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private selectConfig = inject(CfSelectUsersSignalConfigService);
  cfRolesService = inject(CfRolesService);

  // SignalListConfig backing the wizard's user-pick step. Built once at
  // construction and rendered via <app-signal-list>.
  readonly listConfig: WritableSignal<SignalListConfig<CfUser>>;

  // The wizard's selection set, derived from the signal-config's
  // selectedKeys + users() each tick.
  readonly selectedUsers: Signal<CfUser[]> = computed(() => this.selectConfig.resolveSelected());

  // EnumerateComponent takes an Observable<any[]>; bridge the selection
  // signal back to one for the existing label rendering.
  readonly selectedUsers$: Observable<CfUser[]> = toObservable(this.selectedUsers);

  readonly valid$ = signal<boolean>(false);

  constructor() {
    this.listConfig = signal(this.selectConfig.buildConfig());

    // Mirror selection length into valid$ so the wizard's Next gate
    // enables only when at least one user is picked.
    effect(() => {
      this.valid$.set(this.selectedUsers().length > 0);
    });
  }

  onNext = () => {
    const users = this.selectedUsers();
    this.store.dispatch(new UsersRolesSetUsers(this.activeRouteCfOrgSpace.cfGuid, users));
    return of({ success: true });
  };
}
