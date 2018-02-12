import { Component, OnInit } from '@angular/core';
import { CloudFoundryEndpointService } from '../../cloud-foundry-base/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-summary-tab',
  templateUrl: './cloud-foundry-summary-tab.component.html',
  styleUrls: ['./cloud-foundry-summary-tab.component.scss']
})
export class CloudFoundrySummaryTabComponent implements OnInit {
  constructor(private cfEndpointService: CloudFoundryEndpointService) {}

  ngOnInit() {}
}
