import { ChangeDetectionStrategy, Component, computed } from '@angular/core';


import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/endpoint-list/endpoint-list.helpers';
import { GIT_ENDPOINT_SUB_TYPES } from '../../../store/git-entity-factory';

const UNKNOWN_GIT_USER = '**token**';


@Component({
  selector: 'lib-git-endpoint-details',
  templateUrl: './git-endpoint-details.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class GitEndpointDetailsComponent extends EndpointListDetailsComponent {

  // jetstream stores this placeholder as the user name when it cannot
  // read the token's user; there is no such GitHub user (or avatar).
  private readonly knownUser = computed(() => {
    const user = this.row()?.user;
    return user && user.name !== UNKNOWN_GIT_USER ? user : undefined;
  });

  readonly name = computed(() => {
    if (!this.row()?.user) {
      return '-';
    }
    return this.knownUser()?.name ?? 'Unknown';
  });

  readonly avatar = computed(() => {
    const user = this.knownUser();
    return user && this.row().sub_type === GIT_ENDPOINT_SUB_TYPES.GITHUB ?
      `https://avatars.githubusercontent.com/${user.name}` :
      undefined;
  });
}
