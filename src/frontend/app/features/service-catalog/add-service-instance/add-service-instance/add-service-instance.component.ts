import { TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, tap, take, filter } from 'rxjs/operators';

import { CfOrgSpaceDataService } from '../../../../shared/data-services/cf-org-space-service.service';
import {
  SetCreateServiceInstanceCFDetails,
  SetCreateServiceInstanceServiceGuid,
} from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { servicesServiceFactoryProvider } from '../../service-catalog.helpers';
import { isMarketplaceMode } from '../../services-helper';
import { CreateServiceInstanceHelperServiceFactory } from '../create-service-instance-helper-service-factory.service';
import { CreateServiceInstanceHelperService } from '../create-service-instance-helper.service';
import { CsiGuidsService } from '../csi-guids.service';

@Component({
  selector: 'app-add-service-instance',
  templateUrl: './add-service-instance.component.html',
  styleUrls: ['./add-service-instance.component.scss'],
  providers: [
    servicesServiceFactoryProvider,
    CreateServiceInstanceHelperServiceFactory,
    TitleCasePipe,
    CsiGuidsService
  ]
})
export class AddServiceInstanceComponent {
  marketPlaceMode: boolean;
  cSIHelperService: CreateServiceInstanceHelperService;
  title$: Observable<string>;
  serviceInstancesUrl: string;
  servicesWallCreateInstance = false;
  stepperText = 'Select a Cloud Foundry instance, organization and space for the service instance.';
  constructor(
    private cSIHelperServiceFactory: CreateServiceInstanceHelperServiceFactory,
    private activatedRoute: ActivatedRoute,
    private store: Store<AppState>,
    private cfOrgSpaceService: CfOrgSpaceDataService,
    private csiGuidsService: CsiGuidsService
  ) {
    if (isMarketplaceMode(activatedRoute)) {
      const { cfId, serviceId } = activatedRoute.snapshot.params;
      this.csiGuidsService.cfGuid = cfId;
      this.csiGuidsService.serviceGuid = serviceId;
      this.cSIHelperService = cSIHelperServiceFactory.create(cfId, serviceId);
      this.store.dispatch(new SetCreateServiceInstanceCFDetails(cfId));
      this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceId));
      this.initialiseForMarketplaceMode(serviceId, cfId);
      this.marketPlaceMode = true;
      cfOrgSpaceService.cf.list$.pipe(
        filter(p => !!p),
        map(endpoints => endpoints.filter(e => e.guid === cfId)),
        map(e => e[0]),
        tap(e => cfOrgSpaceService.cf.select.next(e.guid)),
        take(1)
      ).subscribe();
    } else {
      this.initialiseForDefaultMode();
    }
  }

  onNext = () => {
    this.store.dispatch(new SetCreateServiceInstanceCFDetails(
      this.cfOrgSpaceService.cf.select.getValue(),
      this.cfOrgSpaceService.org.select.getValue(),
      this.cfOrgSpaceService.space.select.getValue()
    ));
    return Observable.of({ success: true });
  }


  private initialiseForDefaultMode() {
    this.servicesWallCreateInstance = true;
    this.title$ = Observable.of(`Create Service Instance`);
  }

  private initialiseForMarketplaceMode(serviceId: string, cfId: string) {
    const serviceGuid = serviceId;
    this.serviceInstancesUrl = `/service-catalog/${cfId}/${serviceGuid}/instances`;
    this.title$ = this.cSIHelperService.getServiceName().pipe(map(label => `Create Instance: ${label}`));
  }
}
