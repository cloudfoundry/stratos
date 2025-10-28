import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';

import { BooleanIndicatorComponent } from '../../../../../../../../core/src/shared/components/boolean-indicator/boolean-indicator.component';
import { AppChip, ChipsComponent } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import {
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
} from '../../../../../../../../core/src/shared/components/meta-card/meta-card.component';
import { MultilineTitleComponent } from '../../../../../../../../core/src/shared/components/multiline-title/multiline-title.component';
import { APIResource } from '../../../../../../../../store/src/types/api.types';
import { IRule, IRuleType, ISpace } from '../../../../../../cf-api.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    BooleanIndicatorComponent,
    ChipsComponent,
  ]
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
    this.tags = this.row.entity.rules.map(t => ({
      value: `${t.protocol} ${this.getRuleString(t)}`,
      key: t,
      color: this.typeColors[t.protocol]
    }));
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
