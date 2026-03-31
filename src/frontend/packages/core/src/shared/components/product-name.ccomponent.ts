import { Component, inject } from '@angular/core';

import { CustomizationService } from '../../core/customizations.types';

@Component({
  selector: 'app-product-name',
  template: '{{ name }}',
  standalone: true,
  imports: []
})
export class ProductNameComponent {

  name: string;

  constructor() {
    const customizationService = inject(CustomizationService);

    this.name = customizationService.get().appName;
  }
}

