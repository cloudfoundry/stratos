import { Component } from '@angular/core';

import { CustomizationService } from '../../core/customizations.types';

@Component({
  selector: 'app-product-name',
  template: '{{ name }}',
  standalone: false,
})
export class ProductNameComponent {

  name: string;

  constructor(
    customizationService: CustomizationService
  ) {
    this.name = customizationService.get().appName;
  }
}

