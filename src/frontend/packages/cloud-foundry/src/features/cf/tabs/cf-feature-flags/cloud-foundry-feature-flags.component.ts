import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ListComponent, ListConfig } from '@stratosui/core';
import { CfFeatureFlagsListConfigService } from '../../../../shared/components/list/list-types/cf-feature-flags/cf-feature-flags-list-config.service';

@Component({
  selector: 'app-cloud-foundry-feature-flags',
  templateUrl: './cloud-foundry-feature-flags.component.html',
  styleUrls: ['./cloud-foundry-feature-flags.component.scss'],
  providers: [
    {
      provide: ListConfig,
      useClass: CfFeatureFlagsListConfigService
    }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ListComponent
  ]
})
export class CloudFoundryFeatureFlagsComponent { }
