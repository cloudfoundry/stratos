import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StratosBaseCatalogueEntity } from '../../../core/entity-catalogue/entity-catalogue-entity';
import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';

@Component({
  selector: 'app-api-entity-list-page',
  templateUrl: './api-entity-list-page.component.html',
  styleUrls: ['./api-entity-list-page.component.scss']
})
export class ApiEntityListPageComponent implements OnInit {
  public catalogueEntity: StratosBaseCatalogueEntity;
  constructor(
    public route: ActivatedRoute
  ) { }

  ngOnInit() {
    const endpointType = this.route.parent ? this.route.parent.snapshot.params.endpointType : null;
    const entityType = this.route.snapshot.params.entityType;
    this.catalogueEntity = entityCatalogue.getEntity(endpointType, entityType);
  }

}
