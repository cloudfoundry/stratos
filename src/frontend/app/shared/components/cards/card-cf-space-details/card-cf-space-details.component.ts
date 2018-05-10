import { Component, OnInit } from '@angular/core';

import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-details',
  templateUrl: './card-cf-space-details.component.html',
  styleUrls: ['./card-cf-space-details.component.scss']
})
export class CardCfSpaceDetailsComponent {
  constructor(private cfSpaceService: CloudFoundrySpaceService) { }
}
