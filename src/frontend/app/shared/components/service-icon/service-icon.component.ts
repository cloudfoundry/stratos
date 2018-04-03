import { Component, OnInit, Input } from '@angular/core';
import { APIResource } from '../../../store/types/api.types';
import { IService, IServiceExtra } from '../../../core/cf-api-svc.types';

@Component({
  selector: 'app-service-icon',
  templateUrl: './service-icon.component.html',
  styleUrls: ['./service-icon.component.scss']
})
export class ServiceIconComponent implements OnInit {

  extraInfo: IServiceExtra;
  @Input('service') service: APIResource<IService>;

  @Input('addMenuPadding') addMenuPadding = false;
  constructor() { }

  ngOnInit() {
    if (this.service) {
      this.extraInfo = this.service.entity.extra ? JSON.parse(this.service.entity.extra) : null;
    }
  }

  hasImage() {
    return !!(this.getImageUrl());
  }

  getImageUrl() {

    let image = '';
    if (this.extraInfo && this.extraInfo.imageUrl) {
      image = this.extraInfo.imageUrl;
    }
    return image;
  }
}
