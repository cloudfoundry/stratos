import { Component } from '@angular/core';

import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';
import { EndpointModel } from '../../../../../store/src/types/endpoint.types';
import { GIT_ENDPOINT_SUB_TYPES } from '../../../store/git-entity-factory';


@Component({
  selector: 'lib-git-endpoint-details',
  templateUrl: './git-endpoint-details.component.html',
  styleUrls: ['./git-endpoint-details.component.scss']
})
export class GitEndpointDetailsComponent extends EndpointListDetailsComponent {

  name: string;
  avatar: string;

  set row(row: EndpointModel) {
    if (row && row.user) {
      this.name = row.user.name === '**token**' ? 'Unknown' : row.user.name;
      if (row.sub_type === GIT_ENDPOINT_SUB_TYPES.GITHUB) {
        this.avatar = `https://avatars.githubusercontent.com/${row.user.name}`;
      }
    } else {
      this.name = '-';
      this.avatar = undefined;
    }
  }
}
