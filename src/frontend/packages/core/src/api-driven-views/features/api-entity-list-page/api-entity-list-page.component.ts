import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog.service';
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
    const endpointType = this.route.parent ? this.route.parent.snapshot.params.endpointType : null;
    const entityType = this.route.snapshot.params.entityType;
    const entityConfig = entityCatalog.getEntity(endpointType, entityType);
    if (entityConfig) {
      // All these missing properties will need wiring in for CF case, maybe only endpointGuid for k8s?
      this.config = {
        endpointGuid: null,
        entityConfig: {
          endpointType: entityConfig.endpointType,
          entityType: entityConfig.entityKey,
          schemaKey: null,
          subType: null
        },
        extraArgs: null,
        paginationKey: null
      };
    } else {
      console.warn(`Failed to find entity for. Endpoint Type: ${endpointType}. Entity Type: ${entityType}`);
    }
  }

}
