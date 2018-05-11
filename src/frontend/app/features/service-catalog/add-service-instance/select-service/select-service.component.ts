import { Component, OnInit, AfterContentInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { first, map, share, switchMap, tap, filter } from 'rxjs/operators';
import { Subscription } from 'rxjs/Subscription';

import { IService } from '../../../../core/cf-api-svc.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetCreateServiceInstanceServiceGuid } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { selectCreateServiceInstanceCfGuid } from '../../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../../store/types/api.types';
import { ServicesWallService } from '../../../services/services/services-wall.service';
import { ServicesService } from '../../services.service';

@Component({
  selector: 'app-select-service',
  templateUrl: './select-service.component.html',
  styleUrls: ['./select-service.component.scss'],
  providers: [
    ServicesWallService
  ]
})
export class SelectServiceComponent implements OnDestroy, AfterContentInit {
  serviceSubscription: Subscription;
  services$: Observable<APIResource<IService>[]>;
  stepperForm: FormGroup;
  validate: Observable<boolean>;


  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private servicesWallService: ServicesWallService
  ) {
    this.stepperForm = new FormGroup({
      service: new FormControl(''),
    });

    this.services$ = this.store.select(selectCreateServiceInstanceCfGuid).pipe(
      filter(p => !!p),
      tap(p => console.log(`cfGuid: ${p}`)),
      switchMap(guid => servicesWallService.getServicesInCf(guid)),
      tap(ss => console.log(ss)),
      filter(p => !!p),
      first(),
      share()
    );
  }

  onNext = () => Observable.of({
    success: true
  })

  ngAfterContentInit() {

    this.validate = this.stepperForm.statusChanges.pipe(
      map(() => this.stepperForm.valid)
    );

    this.serviceSubscription = this.services$.pipe(
      tap(services => {
        const guid = services[0].metadata.guid;
        this.stepperForm.controls.service.setValue(guid);
        this.store.dispatch(new SetCreateServiceInstanceServiceGuid(guid));
      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    this.serviceSubscription.unsubscribe();
  }
}
