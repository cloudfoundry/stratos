import { Component } from '@angular/core';

import { TabNavService } from '../../../tab-nav.service';

@Component({
  selector: 'app-no-endpoints-non-admin',
  templateUrl: './no-endpoints-non-admin.component.html',
  styleUrls: ['./no-endpoints-non-admin.component.scss']
})
export class NoEndpointsNonAdminComponent {
  constructor(public tabNavService: TabNavService) { }
}
