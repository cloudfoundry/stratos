import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ApplicationService } from '../../../cloud-foundry/src/features/applications/application.service';
import { getGuids } from '../../../cloud-foundry/src/features/applications/application/application-base.component';
import { APP_GUID, CF_GUID } from '../../../core/src/shared/entity.tokens';

@Component({
  selector: 'app-autoscaler-base',
  templateUrl: './autoscaler-base.component.html',
  styleUrls: ['./autoscaler-base.component.scss'],
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
  ]
})
export class AutoscalerBaseComponent {
}
