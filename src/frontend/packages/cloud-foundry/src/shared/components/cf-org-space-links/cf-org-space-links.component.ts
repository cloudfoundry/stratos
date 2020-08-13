import { Component, Input } from '@angular/core';

import { CfOrgSpaceLabelService } from '../../services/cf-org-space-label.service';

@Component({
  selector: 'app-cf-org-space-links',
  templateUrl: './cf-org-space-links.component.html',
  styleUrls: ['./cf-org-space-links.component.scss']
})
export class CfOrgSpaceLinksComponent {

  @Input() service: CfOrgSpaceLabelService;
  @Input() spaceBreadCrumbs: string;
}
