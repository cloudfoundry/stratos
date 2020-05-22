import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { GeneralAppState } from '../../../../../store/src/app-state';
import { entityCatalog } from '../../../../../store/src/entity-catalog/entity-catalog';
import { connectedEndpointsOfTypesSelector } from '../../../../../store/src/selectors/endpoint.selectors';
import { TabNavService } from '../../../../tab-nav.service';
import { IPageSideNavTab } from '../../../features/dashboard/page-side-nav/page-side-nav.component';

@Component({
  selector: 'app-api-entity-type-select-page',
  templateUrl: './api-entity-type-select-page.component.html',
  styleUrls: ['./api-entity-type-select-page.component.scss']
})
export class ApiEntityTypeSelectPageComponent implements OnInit {
  public connectedEndpointsOfType$: Observable<string>;
  public tabs: IPageSideNavTab[];
  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tabNavService: TabNavService,
    private store: Store<GeneralAppState>
  ) { }

  ngOnInit() {
    const endpointGuid = this.route.snapshot.params.endpointId;
    const endpointType = this.route.snapshot.params.endpointType;
    const endpointEntity = entityCatalog.getEndpoint(endpointType);
    const endpointEntities = entityCatalog.getAllEntitiesForEndpointType(endpointType);
    const entitiesWithGetMultiple = endpointEntities.filter(
      entity => entity && entity.definition.tableConfig && entity.actionOrchestrator.hasActionBuilder('getMultiple')
    );
    this.connectedEndpointsOfType$ = this.store.select(connectedEndpointsOfTypesSelector(endpointType)).pipe(
      map(endpoints => endpoints[endpointGuid] ? endpoints[endpointGuid].name : 'Entities')
    );
    if (endpointEntity) {
      this.tabNavService.setHeader(endpointEntity.definition.label);
    }
    this.tabs = entitiesWithGetMultiple.map(entity => {
      return {
        link: entity.type,
        label: entity.definition.labelPlural,
        icon: entity.definition.icon,
        iconFont: entity.definition.iconFont
      };
    });
  }

}
