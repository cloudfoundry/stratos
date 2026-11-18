import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Params, RouterModule } from '@angular/router';

import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';

@Component({
  selector: 'app-cf-org-space-links',
  templateUrl: './cf-org-space-links.component.html',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
  ]
})
export class CfOrgSpaceLinksComponent {

  readonly service = input.required<CfOrgSpaceLabelService>();
  // Query params for the space link (e.g. { breadcrumbs: 'services-wall' })
  readonly spaceBreadCrumbs = input<Params>();
}
