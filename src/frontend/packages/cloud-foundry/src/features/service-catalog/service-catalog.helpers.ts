import { Provider } from '@angular/core';

import { ServicesService } from './services.service';


export const servicesServiceFactoryProvider: Provider = {
  provide: ServicesService,
  useClass: ServicesService,
};
