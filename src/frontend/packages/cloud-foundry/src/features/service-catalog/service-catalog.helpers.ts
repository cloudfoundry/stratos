import { Provider } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { ServicesService } from './services.service';


export function servicesServiceFactory(
  activatedRoute: ActivatedRoute,
) {
  return new ServicesService(activatedRoute);
}

export const servicesServiceFactoryProvider: Provider = {
  provide: ServicesService,
  useFactory: servicesServiceFactory,
  deps: [ActivatedRoute]
};
