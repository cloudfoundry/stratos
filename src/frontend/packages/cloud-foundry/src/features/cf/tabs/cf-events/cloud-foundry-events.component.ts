import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ListConfig } from '@stratosui/core';
import {
  CfAllEventsConfigService,
} from '../../../../shared/components/list/list-types/cf-events/types/cf-all-events-config.service';
import { CloudFoundryEventsListComponent } from '../../../../shared/components/cloud-foundry-events-list/cloud-foundry-events-list.component';

@Component({
  selector: 'app-cloud-foundry-events',
  templateUrl: './cloud-foundry-events.component.html',
  styleUrls: ['./cloud-foundry-events.component.scss'],
  providers: [{
    provide: ListConfig,
    useClass: CfAllEventsConfigService,
  }],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudFoundryEventsListComponent
  ]
})
export class CloudFoundryEventsComponent { }
