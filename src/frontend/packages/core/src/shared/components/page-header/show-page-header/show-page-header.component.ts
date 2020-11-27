import { Component } from '@angular/core';

import { TabNavService } from '../../../../tab-nav.service';

@Component({
  selector: 'app-show-page-header',
  templateUrl: './show-page-header.component.html',
  styleUrls: ['./show-page-header.component.scss']
})
export class ShowPageHeaderComponent {

  constructor(public tabNavService: TabNavService) { }

}
