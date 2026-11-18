import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';

import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CloudFoundryOrganizationService } from '../../../features/cf/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../features/cf/services/cloud-foundry-space.service';
import { activeTabKey } from '../../active-tab-key';
import {
  CLOUD_FOUNDRY_CLI_COMMANDS,
  commandsForTab,
  ORGANIZATION_CLI_COMMANDS,
  SPACE_CLI_COMMANDS,
} from '../cli-info/cli-commands';
import { CliMenuComponent } from './cli-menu.component';

// The CF CLI menu of a Cloud Foundry, organization or space page: picks the
// level, the names and the CLI Info page from the route, so a page places it
// with one tag.
@Component({
  selector: 'app-cf-cli-menu',
  template: '<app-cli-menu [commands]="commands()" [context]="names()" [allLink]="allLink"></app-cli-menu>',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CliMenuComponent],
})
export class CfCliMenuComponent {
  private route = inject(ActiveRouteCfOrgSpace);
  // Both services request their organization or space when they are built,
  // so each is asked for only on a route that names one.
  private orgService = this.route.orgGuid ? inject(CloudFoundryOrganizationService) : null;
  private spaceService = this.route.spaceGuid ? inject(CloudFoundrySpaceService) : null;

  // The tab whose commands to show. A Summary tab names itself; a page shell
  // leaves it unset and the open tab is used.
  readonly tab = input<string | null>(null);
  private activeTab = activeTabKey();

  private list = this.route.spaceGuid ? SPACE_CLI_COMMANDS
    : this.route.orgGuid ? ORGANIZATION_CLI_COMMANDS
    : CLOUD_FOUNDRY_CLI_COMMANDS;

  readonly commands = computed(() => commandsForTab(this.list, this.tab() ?? this.activeTab()));

  readonly names = computed(() => ({
    orgName: this.orgService?.orgDataService.org()?.name ?? '',
    spaceName: this.spaceService?.spaceDataService.space()?.name ?? '',
  }));

  readonly allLink = [
    '/cloud-foundry', this.route.cfGuid,
    ...(this.route.orgGuid ? ['organizations', this.route.orgGuid] : []),
    ...(this.route.spaceGuid ? ['spaces', this.route.spaceGuid] : []),
    'cli',
  ];
}
