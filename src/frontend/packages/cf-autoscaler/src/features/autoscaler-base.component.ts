import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { APP_DETAIL_PROVIDERS } from '@stratosui/cloud-foundry';

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
export class AutoscalerBaseComponent {
}
