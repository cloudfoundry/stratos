import { Component, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { of as observableOf } from 'rxjs';

import { CFAppState } from '../../../../../../../../cloud-foundry/src/cf-app-state';
import { IService, IServiceExtra } from '../../../../../../../../core/src/core/cf-api-svc.types';
import { AppChip } from '../../../../../../../../core/src/shared/components/chips/chips.component';
import { CardCell } from '../../../../../../../../core/src/shared/components/list/list.types';
import { CfOrgSpaceLabelService } from '../../../../../../../../core/src/shared/services/cf-org-space-label.service';
import { RouterNav } from '../../../../../../../../store/src/actions/router.actions';
import { APIResource } from '../../../../../../../../store/src/types/api.types';

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
  cfOrgSpace: CfOrgSpaceLabelService;
  extraInfo: IServiceExtra;
  tags: AppChip<ServiceTag>[] = [];

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

      if (!this.cfOrgSpace) {
        this.cfOrgSpace = new CfOrgSpaceLabelService(this.store, this.serviceEntity.entity.cfGuid);
      }
    }
  }

  constructor(private store: Store<CFAppState>) {
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

  getSpaceBreadcrumbs = () => ({ breadcrumbs: 'services-wall' });

  goToServiceInstances = () =>
    this.store.dispatch(new RouterNav({
      path: ['marketplace', this.serviceEntity.entity.cfGuid, this.serviceEntity.metadata.guid]
    }))
}
