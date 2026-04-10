
import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

import { APP_GUID, CF_GUID } from '@stratosui/core';
import { ApplicationService } from '../application.service';

export function applicationServiceFactory() {
  return new ApplicationService();
}

export function getGuids(type?: string) {
  return (activatedRoute: ActivatedRoute) => {
    const { id, endpointId } = activatedRoute.snapshot.params;
    if (type) {
      return endpointId;
    }
    return id;
  };
}

@Component({
  selector: 'app-application-base',
  templateUrl: './application-base.component.html',
  styleUrls: ['./application-base.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterModule
],
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
    {
      provide: ApplicationService,
      useFactory: applicationServiceFactory,
      deps: []
    }
  ]
})
export class ApplicationBaseComponent {
}
