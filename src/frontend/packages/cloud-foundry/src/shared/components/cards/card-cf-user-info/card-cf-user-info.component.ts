import { Component, OnInit, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MetadataItemComponent,
  CardWrapperComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent
} from '@stratosui/core';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';

@Component({
  selector: 'app-card-cf-user-info',
  templateUrl: './card-cf-user-info.component.html',
  styleUrls: ['./card-cf-user-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    CommonModule,
    MetadataItemComponent,
    CardWrapperComponent,
    CardHeaderComponent,
    CardTitleComponent,
    CardContentComponent
  ]
})
export class CardCfUserInfoComponent implements OnInit {
  public cfEndpointService = inject(CloudFoundryEndpointService);

  ngOnInit() { }

  isAdmin(user) {
    return user && user.admin ? 'Yes' : 'No';
  }
}
