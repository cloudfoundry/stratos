import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { getActiveRouteCfOrgSpaceProvider } from '../cf.helpers';
import { ActiveRouteCfOrgSpace } from '../cf-page.types';

@Component({
  selector: 'app-add-organization',
  templateUrl: './add-organization.component.html',
  styleUrls: ['./add-organization.component.scss'],
  providers: [
    getActiveRouteCfOrgSpaceProvider
  ]
})
export class AddOrganizationComponent implements OnInit {

  cfUrl: string;
  constructor(
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace
  ) {
    const cfId = activeRouteCfOrgSpace.cfGuid;
    this.cfUrl = `/cloud-foundry/${cfId}/organizations`;
  }

  ngOnInit() {
  }

}
