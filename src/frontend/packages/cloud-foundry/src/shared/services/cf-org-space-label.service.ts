import { Store } from '@ngrx/store';
import { combineLatest, Observable } from 'rxjs';
import { take, filter, map, tap } from 'rxjs/operators';

import {
  APIResource,
  endpointEntityType,
  EndpointModel,
  entityCatalog,
  selectEntity,
  STRATOS_ENDPOINT_TYPE
} from '@stratosui/store';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CFAppState } from '../../cf-app-state';
import { organizationEntityType, spaceEntityType } from '../../cf-entity-types';
import { haveMultiConnectedCfs } from '../../features/cf/cf.helpers';
import { selectCfEntity } from '../../store/selectors/api.selectors';
import { CfCurrentUserRolesSignalService } from '../../user-permissions/cf-current-user-roles-signal.service';
import { cfOsDebugLog } from '../data-services/cf-org-space-debug';

export class CfOrgSpaceLabelService {

  public multipleConnectedEndpoints$: Observable<boolean>;
  private cf$: Observable<EndpointModel>;
  private org$: Observable<APIResource<IOrganization>>;
  private space$: Observable<APIResource<ISpace>>;

  /**
   * @param store NgRx Store instance
   * @param cfGuid Only important if using getValue
   * @param orgGuid Only important if using getValue
   * @param spaceGuid Only important if using getValue
   */
  constructor(
    private store: Store<CFAppState>,
    cfRoles: CfCurrentUserRolesSignalService,
    private cfGuid?: string,
    private orgGuid?: string,
    private spaceGuid?: string) {
    // FWT-917 diagnostic: log the GUIDs the caller passed in. If any are
    // missing here, every breadcrumb / link rendered by this service will
    // be empty regardless of store state — that's the H1 fingerprint for
    // the breadcrumb path.
    cfOsDebugLog('labelService:construct', { cfGuid, orgGuid, spaceGuid });

    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(cfRoles);
    // FIXME: hide STRATOS_ENDPOINT_TYPE from extensions - STRAT-154
    const endpointEntityKey = entityCatalog.getEntityKey(STRATOS_ENDPOINT_TYPE, endpointEntityType);

    this.cf$ = this.store.select<EndpointModel>(selectEntity(endpointEntityKey, this.cfGuid)).pipe(
      tap(cf => cfOsDebugLog('labelService:cf-emit', {
        guid: this.cfGuid, found: !!cf, name: cf?.name ?? null,
      })),
    );

    this.org$ = this.store.select<APIResource<IOrganization>>(selectCfEntity(organizationEntityType, this.orgGuid)).pipe(
      tap(org => cfOsDebugLog('labelService:org-emit', {
        guid: this.orgGuid, found: !!org, name: org?.entity?.name ?? null,
      })),
    );
    this.space$ = this.store.select<APIResource<ISpace>>(selectCfEntity(spaceEntityType, this.spaceGuid)).pipe(
      tap(space => cfOsDebugLog('labelService:space-emit', {
        guid: this.spaceGuid, found: !!space, name: space?.entity?.name ?? null,
      })),
    );
  }

  getLabel(): Observable<string> {
    return this.multipleConnectedEndpoints$.pipe(
      map(multipleConnectedEndpoints => multipleConnectedEndpoints ? 'CF/Org/Space' : 'Org/Space')
    );
  }

  getValue(): Observable<string> {
    return combineLatest(
      this.cf$,
      this.org$,
      this.space$,
      this.multipleConnectedEndpoints$
    ).pipe(
      filter(([cf, org, space]) => !!cf && !!org && !!space),
      take(1),
      map(([cf, org, space, multipleConnectedEndpoints]) =>
        multipleConnectedEndpoints ? `${cf.name}/${org.entity.name}/${space.entity.name}` : `${org.entity.name}/${space.entity.name}`
      )
    );
  }

  getCfURL = () => ['/cloud-foundry', this.cfGuid, 'summary'];
  getCfName = () => this.cf$.pipe(map(cf => cf ? cf.name : ''));

  getOrgURL = () => ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'summary'];
  getOrgName = () => this.org$.pipe(map(org => org ? org.entity.name : ''));

  getSpaceURL = () => ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'summary'];
  getSpaceName = () => this.space$.pipe(map(space => space ? space.entity.name : ''));
}
