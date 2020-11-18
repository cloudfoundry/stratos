import { Component } from '@angular/core';

import {
  EndpointListDetailsComponent,
} from '../../../../../core/src/shared/components/list/list-types/endpoint/endpoint-list.helpers';

@Component({
  selector: 'lib-git-endpoint-details',
  templateUrl: './git-endpoint-details.component.html',
  styleUrls: ['./git-endpoint-details.component.scss']
})
export class GitEndpointDetailsComponent extends EndpointListDetailsComponent { }
