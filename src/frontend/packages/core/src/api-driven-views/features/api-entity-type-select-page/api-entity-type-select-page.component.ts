import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { entityCatalogue } from '../../../core/entity-catalogue/entity-catalogue.service';
import { ApiEntityType } from '../../api-drive-views.types';

@Component({
  selector: 'app-api-entity-type-select-page',
  templateUrl: './api-entity-type-select-page.component.html',
  styleUrls: ['./api-entity-type-select-page.component.scss']
})
export class ApiEntityTypeSelectPageComponent implements OnInit {
  public entityTypes: ApiEntityType[];
  constructor(
    private route: ActivatedRoute,
    private router: Router
  ) { }
  public entitySelected(entity: ApiEntityType) {
    this.router.navigate([entity.type], { relativeTo: this.route });
  }
  ngOnInit() {
    const endpointType = this.route.snapshot.params.endpointType;
    const endpointEntities = entityCatalogue.getAllEntitiesForEndpointType(endpointType);
    const entitiesWithGetMultiple = endpointEntities.filter(entity => entity.actionOrchestrator.hasActionBuilder('getMultiple'));
    this.entityTypes = entitiesWithGetMultiple.map(entity => new ApiEntityType(
      entity.type,
      entity.definition.labelPlural || entity.definition.label
    ));
    console.log(this.entityTypes);
  }

}
