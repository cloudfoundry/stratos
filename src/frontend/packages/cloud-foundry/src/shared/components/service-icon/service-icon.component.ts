import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { CustomIconComponent } from '@stratosui/core';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IService, IServiceExtra } from '../../../cf-api-svc.types';

@Component({
  selector: 'app-service-icon',
  templateUrl: './service-icon.component.html',
  styleUrls: ['./service-icon.component.scss'],
  standalone: true,
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
  constructor() { }

  ngOnInit() {
    if (this.service && this.service.entity) {
      this.extraInfo = this.service.entity.extra ? JSON.parse(this.service.entity.extra) : null;
      if (this.extraInfo && this.extraInfo.imageUrl) {
        this.image = this.extraInfo.imageUrl;
      }
    }
  }

  imageLoadError() {
    this.image = '';
  }
}
