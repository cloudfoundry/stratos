import { Component, OnInit, Input } from '@angular/core';
import { IService, IServiceExtra } from '../../../../../../core/cf-api.types';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
interface Tag {
  value: string;
  key: APIResource<IService>;
}
@Component({
  selector: 'app-cf-service-card',
  templateUrl: './cf-service-card.component.html',
  styleUrls: ['./cf-service-card.component.scss']
})
export class CfServiceCardComponent implements OnInit {

  @Input('row') row: APIResource<IService>;
  extraInfo: IServiceExtra;
  tags: AppChip<Tag>[] = [];
  constructor() {

  }

  ngOnInit() {
    this.extraInfo = this.row.entity.extra ? JSON.parse(this.row.entity.extra) : null;
    this.row.entity.tags.forEach(t => {
      this.tags.push({
        value: t,
        hideClearButton: true
      });
    });
  }

  getDisplayName() {
    if (this.extraInfo && this.extraInfo.displayName) {
      return this.extraInfo.displayName;
    }
    return this.row.entity.label;
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

  hasDocumentationUrl() {
    return !!(this.getDocumentationUrl());
  }
  getDocumentationUrl() {
    return this.extraInfo && this.extraInfo.documentationUrl;
  }

  hasSupportUrl() {
    return !!(this.getSupportUrl());
  }
  getSupportUrl() {
    return this.extraInfo && this.extraInfo.supportUrl;
  }
}
