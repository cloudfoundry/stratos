import { Component, OnInit } from '@angular/core';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/cloud-foundry-base/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-card-cf-user-info',
  templateUrl: './card-cf-user-info.component.html',
  styleUrls: ['./card-cf-user-info.component.scss']
})
export class CardCfUserInfoComponent implements OnInit {
  constructor(private cfEndpointService: CloudFoundryEndpointService) {}

  ngOnInit() {}

  isAdmin(user) {
    return user && user.admin ? 'Yes' : 'No';
  }
}
