import { Component, OnInit } from '@angular/core';

import { CloudFoundryEndpointService } from '../../../../services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-cloud-foundry-space-base',
  templateUrl: './cloud-foundry-space-base.component.html',
  styleUrls: ['./cloud-foundry-space-base.component.scss']
})
export class CloudFoundrySpaceBaseComponent implements OnInit {

  tabLinks = [
    {
      link: 'apps',
      label: 'Applications',
    },
    {
      link: 'service-instances',
      label: 'Service Instances'
    },
    {
      link: 'routes',
      label: 'Routes',
    },
    {
      link: 'users',
      label: 'Users',
    }
  ];
  constructor(private cfEndpointService: CloudFoundryEndpointService) { }

  ngOnInit() {
  }

}
