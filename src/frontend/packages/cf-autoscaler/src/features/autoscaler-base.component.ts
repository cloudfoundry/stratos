import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_DETAIL_PROVIDERS } from '@stratosui/cloud-foundry';
import { APP_GUID, CF_GUID } from '@stratosui/core';
import { AppDetailDataService } from '../../../cloud-foundry/src/features/applications/app-detail-data.service';

@Component({
  selector: 'app-autoscaler-base',
  templateUrl: './autoscaler-base.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The same app-detail providers as the app page: ApplicationService
  // needs AppDetailDataService and the services it depends on.
  providers: APP_DETAIL_PROVIDERS,
  standalone: true,
  imports: [RouterOutlet]
})
export class AutoscalerBaseComponent implements OnInit {
  private readonly dataService = inject(AppDetailDataService);
  private readonly cfGuid = inject(CF_GUID);
  private readonly appGuid = inject(APP_GUID);

  // As the app page does: the data service loads nothing until initialized.
  ngOnInit(): void {
    this.dataService.initialize(this.cfGuid, this.appGuid);
  }
}
