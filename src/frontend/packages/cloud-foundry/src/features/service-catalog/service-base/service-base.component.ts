import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * ServiceBaseComponent — bare router-outlet host for the service-offering
 * detail page. Stage 9b-2: was previously the DI seam for the ngrx-coupled
 * ServicesService; now empty because each child tab/component reads
 * directly from EndpointDataService + ServiceCatalogDataService and
 * scopes its own state via tab-scoped providers.
 */
@Component({
  selector: 'app-service-base',
  templateUrl: './service-base.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
  ],
})
export class ServiceBaseComponent { }
