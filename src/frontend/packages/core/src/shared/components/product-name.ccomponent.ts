import {
  Component,
  computed,
  inject,
  ChangeDetectionStrategy,
} from "@angular/core";

import { StratosBrandingService } from "../../../../theme/stratos-branding.service";

@Component({
  selector: "app-product-name",
  template: "{{ name() }}",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.Eager,
  imports: [],
})
export class ProductNameComponent {
  private branding = inject(StratosBrandingService);
  name = computed(() => this.branding.getCompanyName());
}
