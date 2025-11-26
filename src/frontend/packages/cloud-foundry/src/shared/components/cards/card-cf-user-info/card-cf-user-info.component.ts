import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule, AsyncPipe } from '@angular/common';
import {
  MetadataItemComponent,
  CardWrapperComponent,
  CardHeaderComponent,
  CardTitleComponent,
  CardContentComponent
} from '@stratosui/core';
import { CloudFoundryEndpointService } from '../../../../features/cf/services/cloud-foundry-endpoint.service';
import type { CfUser } from '../../../../store/types/cf-user.types';

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
export class CardCfUserInfoComponent {
  public cfEndpointService = inject(CloudFoundryEndpointService);

  isAdmin(user: CfUser): string {
    return user?.admin ? 'Yes' : 'No';
  }
}
