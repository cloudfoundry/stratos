import { Component, Input , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';

@Component({
  selector: 'app-cf-org-space-links',
  templateUrl: './cf-org-space-links.component.html',
  styleUrls: ['./cf-org-space-links.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    RouterModule,
  ]
})
export class CfOrgSpaceLinksComponent {

  @Input() service: CfOrgSpaceLabelService;
  @Input() spaceBreadCrumbs: string;
}
