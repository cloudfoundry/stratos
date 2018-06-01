import { Component, OnInit, OnDestroy } from '@angular/core';
import { CloudFoundryEndpointService } from '../../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

@Component({
  selector: 'app-card-cf-info',
  templateUrl: './card-cf-info.component.html',
  styleUrls: ['./card-cf-info.component.scss']
})
export class CardCfInfoComponent implements OnInit, OnDestroy {
  apiUrl: string;
  subs: Subscription[] = [];
  constructor(private cfEndpointService: CloudFoundryEndpointService) { }

  ngOnInit() {
    const obs$ = this.cfEndpointService.endpoint$.pipe(
      tap(endpoint => {
        this.apiUrl = this.getApiEndpointUrl(endpoint.entity.api_endpoint);
      })
    );

    this.subs.push(obs$.subscribe());
  }

  getApiEndpointUrl(apiEndpoint) {
    const path = apiEndpoint.Path ? `/${apiEndpoint.Path}` : '';
    return `${apiEndpoint.Scheme}://${apiEndpoint.Host}${path}`;
  }

  isAdmin(user) {
    return user && user.admin ? 'Yes' : 'No';
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }
}
