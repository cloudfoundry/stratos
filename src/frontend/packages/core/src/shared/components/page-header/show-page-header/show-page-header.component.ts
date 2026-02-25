import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PortalModule } from '@angular/cdk/portal';

import { TabNavService } from '../../../../tab-nav.service';

@Component({
  selector: 'app-show-page-header',
  templateUrl: './show-page-header.component.html',
  styleUrls: ['./show-page-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    PortalModule
  ]
})
export class ShowPageHeaderComponent {
  public tabNavService = inject(TabNavService);
}
