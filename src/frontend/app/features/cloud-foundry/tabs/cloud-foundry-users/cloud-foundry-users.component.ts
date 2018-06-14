import { CfUserListConfigService } from './../../../../shared/components/list/list-types/cf-users/cf-user-list-config.service';
import { ListConfig } from './../../../../shared/components/list/list.component.types';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-cloud-foundry-users',
  templateUrl: './cloud-foundry-users.component.html',
  styleUrls: ['./cloud-foundry-users.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfUserListConfigService
  }]
})
export class CloudFoundryUsersComponent { }
