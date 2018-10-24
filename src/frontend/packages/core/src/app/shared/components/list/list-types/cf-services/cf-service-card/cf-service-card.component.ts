import { Component, Input, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { IService, IServiceExtra } from '../../../../../../core/cf-api-svc.types';
import { RouterNav } from '../../../../../../store/actions/router.actions';
import { AppState } from '../../../../../../store/app-state';
import { APIResource } from '../../../../../../store/types/api.types';
import { AppChip } from '../../../../chips/chips.component';
import { CardCell } from '../../../list.types';

export interface ServiceTag {
  value: string;
  key: APIResource<IService>;
}
@Component({
  selector: 'app-cf-service-card',
  templateUrl: './cf-service-card.component.html',
  styleUrls: ['./cf-service-card.component.scss']
})
export class CfServiceCardComponent extends CardCell<APIResource<IService>> {

  serviceEntity: APIResource<IService>;
  @Input() disableCardClick = false;

  @Input('row')
  set row(row: APIResource<IService>) {
    if (row) {
      this.serviceEntity = row;
      this.extraInfo = null;
      if (this.serviceEntity.entity.extra) {
        try {
          this.extraInfo = JSON.parse(this.serviceEntity.entity.extra);
        } catch { }
      }
      this.serviceEntity.entity.tags.forEach(t => {
        this.tags.push({
          value: t,
          hideClearButton$: observableOf(true)
        });
      });
    }
  }


  extraInfo: IServiceExtra;
  tags: AppChip<ServiceTag>[] = [];
  constructor(private store: Store<AppState>) {
    super();
  }

  getDisplayName() {
    if (this.extraInfo && this.extraInfo.displayName) {
      return this.extraInfo.displayName;
    }
    return this.serviceEntity.entity.label;
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

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }))
}
