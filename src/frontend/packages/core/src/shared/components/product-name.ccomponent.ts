import { Component, computed, inject } from '@angular/core';

import { StratosBrandingService } from '../../../../theme/stratos-branding.service';

@Component({
  selector: 'app-product-name',
  template: '{{ name() }}',
  standalone: true,
  imports: []
})
export class ProductNameComponent {
  private branding = inject(StratosBrandingService);
  name = computed(() => this.branding.getCompanyName());
}

