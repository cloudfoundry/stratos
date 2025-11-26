import { CommonModule, DatePipe } from '@angular/common';
import { Component, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  BooleanIndicatorComponent,
  type AppChip,
  AppChipsComponent,
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import { type IRule, IRuleType, type ISpace, type ISecurityGroup } from '../../../../../../cf-api.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    DatePipe,
    RouterModule,
    MetaCardComponent,
    MetaCardTitleComponent,
    MetaCardItemComponent,
    MetaCardKeyComponent,
    MetaCardValueComponent,
    MultilineTitleComponent,
    BooleanIndicatorComponent,
    AppChipsComponent,
  ]
})
export class CfSecurityGroupsCardComponent extends CardCell<APIResource<ISecurityGroup>> implements OnInit {

  tags: AppChip<IRule>[] = [];
  private typeColors: Record<string, string> = {
    tcp: 'tcp-class',
    all: 'all-class',
    udp: 'udp-class'
  };
  constructor(
    private cfEndpointService: CloudFoundryEndpointService
  ) {
    super();
  }

  ngOnInit(): void {
    this.tags = this.row.entity.rules.map((t: IRule) => ({
      value: `${t.protocol} ${this.getRuleString(t)}`,
      key: t,
      color: this.typeColors[t.protocol]
    }));
  }

  getSpaceUrl = (space: APIResource<ISpace>): string[] => {
    return [
      '/cloud-foundry',
      `${this.cfEndpointService.cfGuid}`,
      'organizations',
      `${space.entity.organization_guid}`,
      'spaces',
      `${space.metadata.guid}`
    ];

  }

  getRuleString = (rule: IRule): string => {

    let destination = rule.destination;

    if (rule.protocol === IRuleType.tcp || rule.protocol === IRuleType.udp) {
      destination = `${rule.destination}:${rule.ports}`;
    }
    return destination;
  }
}
