import { Component, OnInit } from '@angular/core';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-card-cf-usage',
  templateUrl: './card-cf-usage.component.html',
  styleUrls: ['./card-cf-usage.component.scss']
})
export class CardCfUsageComponent implements OnInit {
  constructor(public cfEndpointService: CloudFoundryEndpointService) { }

  ngOnInit() { }
}
