import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';

import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { AppState } from '../../../store/app-state';
import { CloudFoundryEndpointService } from './cloud-foundry-endpoint.service';
import { tap } from 'rxjs/operators';
import { CloudFoundryService } from '../cloud-foundry.service';

const cfEndpointServiceFactory = (
  store: Store<AppState>,
  activatedRoute: ActivatedRoute,
  entityServiceFactory: EntityServiceFactory
) => {
  const { cfId } = activatedRoute.snapshot.params;
  return new CloudFoundryEndpointService(cfId, store, entityServiceFactory);
};

@Component({
  selector: 'app-cloud-foundry-base',
  templateUrl: './cloud-foundry-base.component.html',
  styleUrls: ['./cloud-foundry-base.component.scss'],
  providers: [
    {
      provide: CloudFoundryEndpointService,
      useFactory: cfEndpointServiceFactory,
      deps: [Store, ActivatedRoute, EntityServiceFactory]
    }
  ]
})
export class CloudFoundryBaseComponent implements OnInit {
  constructor() { }

  ngOnInit() { }
}
