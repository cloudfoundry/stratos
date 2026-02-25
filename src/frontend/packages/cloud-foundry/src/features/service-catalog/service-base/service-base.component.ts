import { Component , ChangeDetectionStrategy } from '@angular/core';
import { ActivatedRoute, RouterOutlet } from '@angular/router';

import { ServicesService } from '../services.service';

export function servicesServiceFactory(
  activatedRoute: ActivatedRoute,
) {
  return new ServicesService(activatedRoute);
}


@Component({
  selector: 'app-service-base',
  templateUrl: './service-base.component.html',
  styleUrls: ['./service-base.component.scss'],
  providers: [
    {
      provide: ServicesService,
      useFactory: servicesServiceFactory,
      deps: [ActivatedRoute]
    }
  ],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet
  ]
})
export class ServiceBaseComponent { }
