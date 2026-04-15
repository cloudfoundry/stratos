import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { ApplicationService, getGuids } from '@stratosui/cloud-foundry';
import { APP_GUID, CF_GUID } from '@stratosui/core';

@Component({
  selector: 'app-autoscaler-base',
  templateUrl: './autoscaler-base.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    ApplicationService,
    {
      provide: CF_GUID,
      useFactory: getGuids('cf'),
      deps: [ActivatedRoute]
    },
    {
      provide: APP_GUID,
      useFactory: getGuids(),
      deps: [ActivatedRoute]
    },
  ],
  standalone: true,
  imports: [RouterOutlet]
})
export class AutoscalerBaseComponent {
}
