import { Component, OnInit } from '@angular/core';

import { IRule, IRuleType, ISpace } from '../../../../../../core/cf-api.types';
import {
  CloudFoundryEndpointService,
} from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { CardCell } from '../../../list.types';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss']
})
export class CfSecurityGroupsCardComponent extends CardCell<APIResource> implements OnInit {

  tags: AppChip<IRule>[] = [];
  private typeColors = {
    tcp: 'tcp-class',
    all: 'all-class',
    udp: 'udp-class'
  };
  constructor(
    private cfEndpointService: CloudFoundryEndpointService
  ) {
    super();
  }

  ngOnInit() {
    this.row.entity.rules.forEach(t => {
      this.tags.push({
        value: `${t.protocol} ${this.getRuleString(t)}`,
        key: t,
        color: this.typeColors[t.protocol]
      });
    });

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

  getRuleString = (rule: IRule) => {

    let destination = rule.destination;

    if (rule.protocol === IRuleType.tcp || rule.protocol === IRuleType.udp) {
      destination = `${rule.destination}:${rule.ports}`;
    }
    return destination;
  }
}
