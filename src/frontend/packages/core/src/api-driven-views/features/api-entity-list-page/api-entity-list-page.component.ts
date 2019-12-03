import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';
import { ListEntityConfig } from '../../../shared/components/list/list-generics/helpers/action-or-config-helpers';

@Component({
  selector: 'app-api-entity-list-page',
  templateUrl: './api-entity-list-page.component.html',
  styleUrls: ['./api-entity-list-page.component.scss']
})
export class ApiEntityListPageComponent implements OnInit {
  public config: ListEntityConfig;
  constructor(
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
    const endpointType = this.route.parent.snapshot.params.endpointType;
    const entityType = this.route.snapshot.params.entityType;
    const a = entityCatalogue.getEntity(endpointType, entityType);
    // All these missing properties will need wiring in for CF case, maybe only endpointGuid for k8s?
    this.config = {
      endpointGuid: null,
      entityConfig: {
        endpointType: a.endpointType,
        entityType: a.entityKey,
        schemaKey: null,
        subType: null
      },
      extraArgs: null,
      paginationKey: null
    };
  }

}
