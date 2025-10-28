import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';

import { MetadataItemComponent } from '../../../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-card-cf-user-info',
  templateUrl: './card-cf-user-info.component.html',
  styleUrls: ['./card-cf-user-info.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MetadataItemComponent
  ]
})
export class CardCfUserInfoComponent implements OnInit {
  constructor(public cfEndpointService: CloudFoundryEndpointService) { }

  ngOnInit() { }

  isAdmin(user) {
    return user && user.admin ? 'Yes' : 'No';
  }
}
