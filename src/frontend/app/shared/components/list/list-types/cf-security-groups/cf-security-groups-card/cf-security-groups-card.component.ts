import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../../../../store/types/api.types';
import { ISecurityGroup, ISpace, IRule, IRuleType } from '../../../../../../core/cf-api.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { AppChip } from '../../../../chips/chips.component';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss']
})
export class CfSecurityGroupsCardComponent extends TableCellCustom<APIResource> implements OnInit {

  tags: AppChip<IRule>[] = [];
  private typeColors = {
    tcp: 'tcp-class',
    all: 'all-class',
    udp: 'udp-class'
  };
  @Input('row') row: APIResource<ISecurityGroup>;
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
