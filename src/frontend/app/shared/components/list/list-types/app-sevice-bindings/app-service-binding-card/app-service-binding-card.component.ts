import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { ListDataSource } from '../../../data-sources-controllers/list-data-source';
import { APIResource, EntityInfo } from '../../../../../../store/types/api.types';
import { IService, IServiceInstance, IServiceBinding } from '../../../../../../core/cf-api-svc.types';
import { AppState } from '../../../../../../store/app-state';
import { IListConfig } from '../../../list.component.types';
import { Store } from '@ngrx/store';
import { TableCellCustom } from '../../../list-table/table-cell/table-cell-custom';
import { EntityServiceFactory } from '../../../../../../core/entity-service-factory.service';
import { entityFactory, serviceSchemaKey, serviceInstancesSchemaKey } from '../../../../../../store/helpers/entity-factory';
import { GetServiceInstance, DeleteServiceBinding } from '../../../../../../store/actions/service-instances.actions';
import { ApplicationService } from '../../../../../../features/applications/application.service';
import { EntityService } from '../../../../../../core/entity-service';
import { tap, filter } from 'rxjs/operators';
import { GetService } from '../../../../../../store/actions/service.actions';
import { Subscription } from 'rxjs/Subscription';
import { Observable } from 'rxjs/Observable';
import { AppChip } from '../../../../chips/chips.component';
import { BehaviorSubject } from 'rxjs';
import { MetaCardMenuItem } from '../../../list-cards/meta-card/meta-card-base/meta-card.component';
import { DeleteAppServiceBinding } from '../../../../../../store/actions/application.actions';

@Component({
  selector: 'app-app-service-binding-card',
  templateUrl: './app-service-binding-card.component.html',
  styleUrls: ['./app-service-binding-card.component.scss']
})
export class AppServiceBindingCardComponent extends TableCellCustom<APIResource<IServiceBinding>> implements OnInit, OnDestroy {

  cardMenu: MetaCardMenuItem[];
  service$: Observable<EntityInfo<APIResource<IService>>>;
  serviceInstance$: Observable<EntityInfo<APIResource<IServiceInstance>>>;
  serviceSubscription: Subscription;
  tags$ = new BehaviorSubject<AppChip<IServiceInstance>[]>([]);
  @Input('row') row: APIResource<IServiceBinding>;

  constructor(private store: Store<AppState>, private entityServiceFactory: EntityServiceFactory, private appService: ApplicationService) {
    super();
    this.cardMenu = [
      {
        icon: 'settings',
        label: 'Detach',
        action: this.detach
      }
    ];
  }
  ngOnInit(): void {
    this.serviceInstance$ = this.entityServiceFactory.create<APIResource<IServiceInstance>>(
      serviceInstancesSchemaKey,
      entityFactory(serviceInstancesSchemaKey),
      this.row.entity.service_instance_guid,
      new GetServiceInstance(this.row.entity.service_instance_guid, this.appService.cfGuid),
      true
    ).entityObs$;

    this.serviceSubscription = this.serviceInstance$.pipe(
      tap(o => {
        this.service$ = this.entityServiceFactory.create<APIResource<IService>>(
          serviceSchemaKey,
          entityFactory(serviceSchemaKey),
          o.entity.entity.service_guid,
          new GetService(o.entity.entity.service_guid, this.appService.cfGuid),
          true
        ).entityObs$;

        const tags = [];
        o.entity.entity.tags.forEach(t => {
          tags.push({
            value: t,
          });
        });
        this.tags$.next(tags);

      })
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.serviceSubscription) {
      this.serviceSubscription.unsubscribe();
    }
  }

  detach = () => {
    this.store.dispatch(new DeleteAppServiceBinding(this.appService.appGuid, this.row.metadata.guid, this.appService.cfGuid));
  }
}
