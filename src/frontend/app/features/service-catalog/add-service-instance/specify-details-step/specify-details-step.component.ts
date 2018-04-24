import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { tap, filter, map, combineLatest, share } from 'rxjs/operators';

import { IOrganization, ISpace } from '../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../shared/monitors/pagination-monitor.factory';
import { SetOrg, SetSpace, SetCreateServiceInstance } from '../../../../store/actions/create-service-instance.actions';
import { AppState } from '../../../../store/app-state';
import { entityFactory, organizationSchemaKey } from '../../../../store/helpers/entity-factory';
import { getPaginationObservables } from '../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { APIResource } from '../../../../store/types/api.types';
import { CloudFoundryEndpointService } from '../../../cloud-foundry/services/cloud-foundry-endpoint.service';
import { ServicesService } from '../../services.service';
import { selectEntity } from '../../../../store/selectors/api.selectors';
import { selectOrgGuid } from '../../../../store/selectors/create-service-instance.selectors';

@Component({
  selector: 'app-specify-details-step',
  templateUrl: './specify-details-step.component.html',
  styleUrls: ['./specify-details-step.component.scss'],
})
export class SpecifyDetailsStepComponent implements OnInit {
  spaces$: Observable<APIResource<ISpace>[]>;
  orgs$: Observable<APIResource<IOrganization>[]>;
  selectedOrgId: string;
  selectedSpaceId: string;

  stepperForm: FormGroup;
  constructor(
    private store: Store<AppState>,
    private servicesService: ServicesService,
    private paginationMonitorFactory: PaginationMonitorFactory

  ) {
    this.stepperForm = new FormGroup({
      name: new FormControl('', Validators.required),
      org: new FormControl('', Validators.required),
      space: new FormControl('', Validators.required),
      params: new FormControl(''),
      tags: new FormControl('')
    });

    const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizations(servicesService.cfGuid);
    this.orgs$ = getPaginationObservables<APIResource<IOrganization>>({
      store: this.store,
      action: getAllOrgsAction,
      paginationMonitor: this.paginationMonitorFactory.create(
        getAllOrgsAction.paginationKey,
        entityFactory(organizationSchemaKey)
      )
    }, true).entities$;

    this.orgs$.pipe(
      tap(o => {
        this.selectedOrgId = o[0].metadata.guid;
        this.store.dispatch(new SetOrg(this.selectedOrgId));
      })
    ).subscribe();

    this.spaces$ = this.store.select(selectOrgGuid).pipe(
      filter(p => !!p),
      combineLatest(this.orgs$),
      map(([guid, orgs]) => orgs.filter(org => org.metadata.guid === guid)[0]),
      map(org => org.entity.spaces),
      share()
    );

    this.spaces$.pipe(
      tap(o => {
        console.log(o[0]);
        this.selectedSpaceId = o[0].metadata.guid;
        this.store.dispatch(new SetSpace(this.selectedOrgId));
      })
    ).subscribe();
  }

  setOrg = (guid) => this.store.dispatch(new SetOrg(guid));


  ngOnInit() {
  }

  validate = () => true;

  onNext = () => {
    const name = this.stepperForm.controls.name.value;
    const space = this.stepperForm.controls.space.value;
    const params = this.stepperForm.controls.params.value;
    const tags = [this.stepperForm.controls.tags.value];
    this.store.dispatch(new SetCreateServiceInstance(name, space, tags, params));
    return Observable.of({ success: true });
  }
}
