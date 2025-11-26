import { Component, Input, type OnInit , ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomIconComponent } from '@stratosui/core';
import type { APIResource } from '@stratosui/store';
import type { IService, IServiceExtra } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-icon',
  templateUrl: './service-icon.component.html',
  styleUrls: ['./service-icon.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    CustomIconComponent
  ]
})
export class ServiceIconComponent implements OnInit {

  image = '';

  extraInfo: IServiceExtra;
  @Input() service: APIResource<IService>;

  @Input() addMenuPadding = false;

  ngOnInit() {
    if (this.service?.entity) {
      this.extraInfo = this.service.entity.extra ? JSON.parse(this.service.entity.extra) : null;
      if (this.extraInfo?.imageUrl) {
        this.image = this.extraInfo.imageUrl;
      }
    }
  }

  imageLoadError() {
    this.image = '';
  }
}
