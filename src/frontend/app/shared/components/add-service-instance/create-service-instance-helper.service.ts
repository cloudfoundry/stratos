import { Inject } from '@angular/core';
import { Store } from '@ngrx/store';
import { combineLatest as observableCombineLatest, Observable, of as observableOf } from 'rxjs';
import { filter, first, map, publishReplay, refCount, share, switchMap } from 'rxjs/operators';

import { IService, IServiceInstance, IServicePlan, IServicePlanVisibility } from '../../../core/cf-api-svc.types';
import { IOrganization, ISpace } from '../../../core/cf-api.types';
import { EntityServiceFactory } from '../../../core/entity-service-factory.service';
import { pathGet } from '../../../core/utils.service';
import { CloudFoundryEndpointService } from '../../../features/cloud-foundry/services/cloud-foundry-endpoint.service';
import { getServicePlans, getSvcAvailability } from '../../../features/service-catalog/services-helper';
import { ServicePlanAccessibility } from '../../../features/service-catalog/services.service';
import { GetServiceInstances } from '../../../store/actions/service-instances.actions';
import { GetServicePlanVisibilities } from '../../../store/actions/service-plan-visibility.actions';
import { GetServicePlanServiceInstances } from '../../../store/actions/service-plan.actions';
import { GetService } from '../../../store/actions/service.actions';
import { GetAllServicesForSpace, GetServiceInstancesForSpace, GetSpace } from '../../../store/actions/space.actions';
import { AppState } from '../../../store/app-state';
import {
  entityFactory,
  organizationSchemaKey,
  serviceInstancesSchemaKey,
  servicePlanVisibilitySchemaKey,
  serviceSchemaKey,
  spaceSchemaKey,
  spaceWithOrgKey,
} from '../../../store/helpers/entity-factory';
import {
  createEntityRelationKey,
  createEntityRelationPaginationKey,
} from '../../../store/helpers/entity-relations/entity-relations.types';
import { getPaginationObservables } from '../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectCreateServiceInstanceServicePlan } from '../../../store/selectors/create-service-instance.selectors';
import { APIResource } from '../../../store/types/api.types';
import { QParam } from '../../../store/types/pagination.types';
import { CF_GUID } from '../../entity.tokens';
import { PaginationMonitorFactory } from '../../monitors/pagination-monitor.factory';

export class CreateServiceInstanceHelper {
  servicePlanVisibilities$: Observable<APIResource<IServicePlanVisibility>[]>;
  service$: Observable<APIResource<IService>>;
  // Is instance being created from the Marketplace
  public marketPlaceMode = false;

  constructor(
    private store: Store<AppState>,
    public serviceGuid: string,
    @Inject(CF_GUID) public cfGuid: string,
    private entityServiceFactory: EntityServiceFactory,
    private paginationMonitorFactory: PaginationMonitorFactory
  ) {
    this.initBaseObservables();
  }

  initBaseObservables = () => {

    const serviceEntityService = this.entityServiceFactory.create<APIResource<IService>>(
      serviceSchemaKey,
      entityFactory(serviceSchemaKey),
      this.serviceGuid,
      new GetService(this.serviceGuid, this.cfGuid),
      true
    );

    this.service$ = serviceEntityService.waitForEntity$.pipe(
      filter(o => !!o && !!o.entity && !!o.entity.entity && !!o.entity.entity.service_plans),
      // filter(o => !!o && !!o.entity),
      map(o => o.entity),
      publishReplay(1),
      refCount()
    );

    const paginationKey = createEntityRelationPaginationKey(servicePlanVisibilitySchemaKey, this.cfGuid);
    this.servicePlanVisibilities$ = getPaginationObservables<APIResource<IServicePlanVisibility>>(
      {
        store: this.store,
        action: new GetServicePlanVisibilities(this.cfGuid, paginationKey),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(servicePlanVisibilitySchemaKey)
        )
      },
      true
    ).entities$;

  }

  getServicePlanVisibilities = (): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(filter(p => !!p))

  getServicePlanVisibilitiesForOrg = (orgGuid: string): Observable<APIResource<IServicePlanVisibility>[]> =>
    this.servicePlanVisibilities$.pipe(
      filter(p => !!p),
      map(entities => entities.filter(entity => entity.entity.organization_guid === orgGuid))
    )

  getServicePlans(): Observable<APIResource<IServicePlan>[]> {
    return getServicePlans(this.service$, this.cfGuid, this.store, this.paginationMonitorFactory);
  }

  getServiceName = () => {
    return this.service$
      .pipe(
        filter(p => !!p),
        map((service: APIResource<IService>) => {
          const extraInfo = JSON.parse(service.entity.extra);
          if (extraInfo && extraInfo.displayName) {
            return extraInfo.displayName;
          } else {
            return service.entity.label;
          }
        }));
  }

  getServicePlanAccessibility = (servicePlan: APIResource<IServicePlan>): Observable<ServicePlanAccessibility> => {
    if (servicePlan.entity.public) {
      return observableOf({
        isPublic: true,
        guid: servicePlan.metadata.guid
      });
    }
    return this.getServicePlanVisibilities().pipe(
      filter(p => !!p),
      map((allServicePlanVisibilities) => getSvcAvailability(servicePlan, null, allServicePlanVisibilities))
    );
  }

  getSelectedServicePlan = (): Observable<APIResource<IServicePlan>> => {
    return observableCombineLatest(this.store.select(selectCreateServiceInstanceServicePlan), this.getServicePlans())
      .pipe(
        filter(([p, q]) => !!p && !!q),
        map(([servicePlanGuid, servicePlans]) => servicePlans.filter(o => o.metadata.guid === servicePlanGuid)),
        map(p => p[0]), filter(p => !!p)
      );
  }

  getSelectedServicePlanAccessibility = (): Observable<ServicePlanAccessibility> => {
    return this.getSelectedServicePlan().pipe(
      switchMap(plan => this.getServicePlanAccessibility(plan))
    );
  }

  getOrgsForSelectedServicePlan = (): Observable<APIResource<IOrganization>[]> => {
    return this.getSelectedServicePlan()
      .pipe(
        switchMap(servicePlan => this.getServicePlanAccessibility(servicePlan)),
        switchMap(servicePlanAccessbility => {
          if (servicePlanAccessbility.isPublic) {
            const getAllOrgsAction = CloudFoundryEndpointService.createGetAllOrganizationsLimitedSchema(this.cfGuid);
            return getPaginationObservables<APIResource<IOrganization>>({
              store: this.store,
              action: getAllOrgsAction,
              paginationMonitor: this.paginationMonitorFactory.create(
                getAllOrgsAction.paginationKey,
                entityFactory(organizationSchemaKey)
              )
            }, true)
              .entities$.pipe(share(), first());
          } else if (servicePlanAccessbility.spaceScoped) {
            // Service plan is not public, but is space-scoped
            const action = new GetSpace(servicePlanAccessbility.spaceGuid, this.cfGuid,
              [
                createEntityRelationKey(spaceSchemaKey, organizationSchemaKey),
              ]
            );
            action.entity = [entityFactory(spaceWithOrgKey)];
            return this.entityServiceFactory.create<APIResource<ISpace>>(
              spaceSchemaKey,
              entityFactory(spaceWithOrgKey),
              servicePlanAccessbility.spaceGuid,
              action,
              true
            ).waitForEntity$
              .pipe(
                // Block until the org is either fetched or associated with existing entity
                filter(p => !!pathGet('entity.entity.organization.entity', p)),
                map((p) => {
                  const orgEntity = { ...p.entity.entity.organization.entity, spaces: [p.entity] };
                  return [{ ...p.entity.entity.organization, entity: orgEntity }];
                }),
            );
          } else if (servicePlanAccessbility.hasVisibilities) {
            // Service plan is not public, fetch visibilities
            return this.getServicePlanVisibilitiesForPlan(servicePlanAccessbility.guid)
              .pipe(
                map(s => s.map(o => o.entity.organization)),
            );
          }
        }
        ),
        share(), first()
      );
  }

  getServicePlanVisibilitiesForPlan = (servicePlanGuid: string): Observable<APIResource<IServicePlanVisibility>[]> => {
    return this.getServicePlanVisibilities().pipe(
      filter(p => !!p),
      map(vis => vis.filter(s => s.entity.service_plan_guid === servicePlanGuid)),
      first()
    );
  }

  getServiceInstancesForService = (servicePlanGuid: string = null, spaceGuid: string = null, cfGuid: string = null) => {
    let action, paginationKey;
    if (spaceGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, `${spaceGuid}-${servicePlanGuid}`);
      const q = [new QParam('service_plan_guid', servicePlanGuid, ':')];
      action = new GetServiceInstancesForSpace(spaceGuid, cfGuid, paginationKey, q);
    } else if (servicePlanGuid) {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, servicePlanGuid);
      action = new GetServicePlanServiceInstances(servicePlanGuid, cfGuid, paginationKey);
    } else {
      paginationKey = createEntityRelationPaginationKey(serviceInstancesSchemaKey, cfGuid);
      action = new GetServiceInstances(cfGuid, paginationKey);
    }
    return getPaginationObservables<APIResource<IServiceInstance>>({
      store: this.store,
      action,
      paginationMonitor: this.paginationMonitorFactory.create(
        paginationKey,
        entityFactory(serviceInstancesSchemaKey)
      )
    }, true)
      .entities$.pipe(
        share()
      );
  }

  getServicesForSpace = (spaceGuid: string, cfGuid: string) => {
    const paginationKey = createEntityRelationPaginationKey(serviceSchemaKey, spaceGuid);
    return getPaginationObservables<APIResource<IService>>(
      {
        store: this.store,
        action: new GetAllServicesForSpace(paginationKey, cfGuid, spaceGuid),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(serviceSchemaKey)
        )
      },
      true
    ).entities$.pipe(
      filter(p => !!p),
      publishReplay(1),
      refCount()
    );
  }

}
