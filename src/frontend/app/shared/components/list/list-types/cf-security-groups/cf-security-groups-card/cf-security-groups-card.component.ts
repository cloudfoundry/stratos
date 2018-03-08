import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { ISecurityGroup, ISpace } from '../../../../../../core/cf-api.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss']
})
export class CfSecurityGroupsCardComponent implements OnInit {

  @Input('row') row: APIResource<ISecurityGroup>;
  constructor(
    private cfEndpointService: CloudFoundryEndpointService
  ) { }

  ngOnInit() {
  }

  getSpaceUrl = (space: APIResource<ISpace>) => {
    return [
      '/cloud-foundry',
      `${this.cfEndpointService.cfGuid}`,
      'organizations',
      `${space.entity.organization_guid}`,
      'spaces',
      `${space.metadata.guid}`
    ];

  }
}
