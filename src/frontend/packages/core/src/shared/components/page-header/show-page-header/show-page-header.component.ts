import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { PortalModule } from '@angular/cdk/portal';

import { TabNavService } from '../../../../tab-nav.service';

@Component({
  selector: 'app-show-page-header',
  templateUrl: './show-page-header.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PortalModule
  ]
})
export class ShowPageHeaderComponent {
  public tabNavService = inject(TabNavService);
}
