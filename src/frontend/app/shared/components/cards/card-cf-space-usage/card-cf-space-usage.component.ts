import { Component, OnInit } from '@angular/core';

import { CloudFoundrySpaceService } from '../../../../features/cloud-foundry/services/cloud-foundry-space.service';

@Component({
  selector: 'app-card-cf-space-usage',
  templateUrl: './card-cf-space-usage.component.html',
  styleUrls: ['./card-cf-space-usage.component.scss']
})
export class CardCfSpaceUsageComponent implements OnInit {

  constructor(private cfSpaceService: CloudFoundrySpaceService) { }

  ngOnInit() {
  }

}
