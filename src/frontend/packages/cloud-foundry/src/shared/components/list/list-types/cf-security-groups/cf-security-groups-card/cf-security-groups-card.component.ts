import { CommonModule } from '@angular/common';
import { Component, OnInit, ChangeDetectionStrategy, inject } from '@angular/core';
import { RouterModule } from '@angular/router';

import {
  BooleanIndicatorComponent,
  AppChip,
  AppChipsComponent,
  CardCell,
  MetaCardComponent,
  MetaCardItemComponent,
  MetaCardKeyComponent,
  MetaCardTitleComponent,
  MetaCardValueComponent,
  MultilineTitleComponent
} from '@stratosui/core';
import { APIResource } from '@stratosui/store';
import { IRule, IRuleType, ISpace } from '../../../../../../cf-api.types';
import { CloudFoundryEndpointService } from '../../../../../../features/cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cf-security-groups-card',
  templateUrl: './cf-security-groups-card.component.html',
  styleUrls: ['./cf-security-groups-card.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
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
    AppChipsComponent,
  ]
})
export class CfSecurityGroupsCardComponent extends CardCell<APIResource<any>> implements OnInit {
  private cfEndpointService = inject(CloudFoundryEndpointService);


  tags: AppChip<IRule>[] = [];
  private typeColors: Record<string, string> = {
    tcp: 'tcp-class',
    all: 'all-class',
    udp: 'udp-class'
  };

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
