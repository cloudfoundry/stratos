import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { tap, map } from 'rxjs/operators';
import { Subscription, Observable } from 'rxjs';
import { EntityInfo, APIResource } from '../../../../store/types/api.types';
import { EndpointModel } from '../../../../store/types/endpoint.types';
import { ICfV2Info } from '../../../../core/cf-api.types';

@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss']
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  apiUrl: string;
  subs: Subscription[] = [];
  constructor(public cfEndpointService: CloudFoundryEndpointService) { }

  description$: Observable<string>;

  ngOnInit() {
    const obs$ = this.cfEndpointService.endpoint$.pipe(
      tap(endpoint => {
        this.apiUrl = this.getApiEndpointUrl(endpoint.entity.api_endpoint);
      })
    );

    this.subs.push(obs$.subscribe());

    this.description$ = this.cfEndpointService.info$.pipe(
      map(entity => this.getDescription(entity))
    );
  }

  getApiEndpointUrl(apiEndpoint) {
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  private getDescription(entity: EntityInfo<APIResource<ICfV2Info>>): string {
    let desc = '-';
    if (entity && entity.entity && entity.entity.entity) {
      const metadata = entity.entity.entity;
      if (metadata.description.length === 0) {
        // No descripion - custom overrides
        if (metadata.support === 'pcfdev@pivotal.io') {
          desc = 'PCF Dev';
        }
      } else {
        desc = metadata.description;
        desc += metadata.build ? ` (${metadata.build})` : '';
      }
    }
    return desc;
  }
}
