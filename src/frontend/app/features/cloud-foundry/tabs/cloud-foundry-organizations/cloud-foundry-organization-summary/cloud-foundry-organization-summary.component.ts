import { Component, OnInit } from '@angular/core';

import { ISubHeaderTabs } from '../../../../../shared/components/page-subheader/page-subheader.types';

@Component({
  selector: 'app-cloud-foundry-organization-summary',
  templateUrl: './cloud-foundry-organization-summary.component.html',
  styleUrls: ['./cloud-foundry-organization-summary.component.scss']
})
export class CloudFoundryOrganizationSummaryComponent implements OnInit {

  nestedTabs: ISubHeaderTabs[] = [{
    link: 'spaces',
    label: 'Space'
  }, {
    link: 'users',
    label: 'Users'
  }];
  constructor() {

  }

  ngOnInit() {

  }

}
