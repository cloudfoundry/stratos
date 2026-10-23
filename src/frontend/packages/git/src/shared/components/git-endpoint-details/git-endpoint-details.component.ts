import { ChangeDetectionStrategy, Component, signal } from '@angular/core';


import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/endpoint-list/endpoint-list.helpers';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
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

  // Signals: set from the `row` setter, outside this view's change detection.
  readonly name = signal('');
  readonly avatar = signal<string | undefined>(undefined);

  set row(row: EndpointModel) {
    super.row = row;
    if (row && row.user) {
      // jetstream stores this placeholder as the user name when it cannot
      // read the token's user; there is no such GitHub user (or avatar).
      const known = row.user.name !== UNKNOWN_GIT_USER;
      this.name.set(known ? row.user.name : 'Unknown');
      this.avatar.set(known && row.sub_type === GIT_ENDPOINT_SUB_TYPES.GITHUB ?
        `https://avatars.githubusercontent.com/${row.user.name}` :
        undefined);
    } else {
      this.name.set('-');
      this.avatar.set(undefined);
    }
  }
  get row(): EndpointModel {
    return super.row;
  }
}
