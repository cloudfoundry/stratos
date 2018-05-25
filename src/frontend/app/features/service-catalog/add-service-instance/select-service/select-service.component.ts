import { AfterContentInit, Component, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Store } from '@ngrx/store';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { Observable } from 'rxjs/Observable';
import { combineLatest, map, filter, switchMap, tap } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IService } from '../../../../core/cf-api-svc.types';
import { EntityServiceFactory } from '../../../../core/entity-service-factory.service';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetCreateServiceInstanceServiceGuid } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import {
  selectCreateServiceInstanceCfGuid,
  selectCreateServiceInstanceSpaceGuid,
} from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesWallService } from '../../../services/services/services-wall.service';
import { CsiGuidsService } from '../csi-guids.service';

@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  styleUrls: ['./select-service.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class SelectServiceComponent implements OnDestroy, AfterContentInit {
  cfGuid: string;
  serviceSubscription: Subscription;
  services$: Observable<APIResource<IService>[]>;
  stepperForm: FormGroup;
  validate: BehaviorSubject<boolean> = new BehaviorSubject(false);

  constructor(
    private store: Store<AppState>,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private entityServiceFactory: EntityServiceFactory,
    private csiGuidService: CsiGuidsService,
    private servicesWallService: ServicesWallService
  ) {

    this.stepperForm = new FormGroup({
      service: new FormControl(''),
    });

    this.services$ = this.store.select(selectCreateServiceInstanceCfGuid).pipe(
      filter(p => !!p),
      combineLatest(this.store.select(selectCreateServiceInstanceSpaceGuid)),
      tap(([cfGuid, spaceGuid]) => this.cfGuid = cfGuid),
      switchMap(([cfGuid, spaceGuid]) => servicesWallService.getServicesInSpace(cfGuid, spaceGuid)),
      filter(p => !!p),
    );
  }

  onNext = () => {
    const serviceGuid = this.stepperForm.controls.service.value;
    this.store.dispatch(new SetCreateServiceInstanceServiceGuid(serviceGuid));
    this.csiGuidService.serviceGuid = serviceGuid;
    this.csiGuidService.cfGuid = this.cfGuid;
    return Observable.of({ success: true });
  }

  ngAfterContentInit() {
    this.serviceSubscription = this.services$.pipe(
      tap(services => {
        const guid = services[0].metadata.guid;
        this.stepperForm.controls.service.setValue(guid);
        setTimeout(() => {
          this.validate.next(true);
        });
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.serviceSubscription.unsubscribe();
  }
}
