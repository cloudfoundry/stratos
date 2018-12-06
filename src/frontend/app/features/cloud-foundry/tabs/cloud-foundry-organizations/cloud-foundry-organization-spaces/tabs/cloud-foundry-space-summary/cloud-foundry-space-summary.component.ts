import { Component, OnInit } from '@angular/core';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';

@Component({
  selector: 'app-cloud-foundry-space-summary',
  templateUrl: './cloud-foundry-space-summary.component.html',
  styleUrls: ['./cloud-foundry-space-summary.component.scss']
})
export class CloudFoundrySpaceSummaryComponent {

  constructor(public cfSpaceService: CloudFoundrySpaceService) { }
}
