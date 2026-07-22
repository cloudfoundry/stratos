import { combineLatest, Observable, of } from 'rxjs';
import { take, filter, map } from 'rxjs/operators';

import { APIResource, EndpointModel } from '@stratosui/store';
import { EndpointsSignalService } from '@stratosui/core';
import { IOrganization, ISpace } from '../../cf-api.types';
import { haveMultiConnectedCfs } from '../../features/cf/cf.helpers';
import { CfCurrentUserRolesSignalService } from '../../user-permissions/cf-current-user-roles-signal.service';
import { cfOsDebugLog } from '../data-services/cf-org-space-debug';

/**
 * Signal-native projection of the CF/org/space breadcrumb labels.
 *
 * The CF endpoint name is sourced from {@link EndpointsSignalService} rather
 * than the legacy ngrx `store.select(selectEntity(...))`. The public
 * observable interface (`getCfName`/`getOrgName`/`getSpaceName`/`getLabel`/
 * `getValue` + the `*URL` builders + `multipleConnectedEndpoints$`) is kept
 * byte-identical so the renderer `CfOrgSpaceLinksComponent` is untouched.
 *
 * Org/space resolution was only ever exercised by the now-dead app cells
 * (`card-app`, `TableCellAppCfOrgSpaceBase`, slated for workstream D); the
 * live breadcrumb path (cf-service-card cluster) passes only `cfGuid`, so
 * org/space stay empty exactly as they did under ngrx.
 */
export class CfOrgSpaceLabelService {

  public multipleConnectedEndpoints$: Observable<boolean>;
  private org$: Observable<APIResource<IOrganization> | null> = of(null);
  private space$: Observable<APIResource<ISpace> | null> = of(null);

  /**
   * @param endpoints Signal-native endpoints projection (CF name source)
   * @param cfRoles Current-user CF roles (drives multipleConnectedEndpoints$)
   * @param cfGuid Only important if using getValue
   * @param orgGuid Only important if using getValue
   * @param spaceGuid Only important if using getValue
   */
  constructor(
    private endpoints: EndpointsSignalService,
    cfRoles: CfCurrentUserRolesSignalService,
    private cfGuid?: string,
    private orgGuid?: string,
    private spaceGuid?: string) {
    cfOsDebugLog('labelService:construct', { cfGuid, orgGuid, spaceGuid });

    this.multipleConnectedEndpoints$ = haveMultiConnectedCfs(cfRoles);
  }

  // Read the endpoints signal on each access so the async-pipe binding picks
  // up the CF entity once the endpoints slice has hydrated.
  private get cf$(): Observable<EndpointModel | null> {
    return of(this.cfGuid ? this.endpoints.endpoints()[this.cfGuid] ?? null : null);
  }

  getLabel(): Observable<string> {
    return this.multipleConnectedEndpoints$.pipe(
      map(multipleConnectedEndpoints => multipleConnectedEndpoints ? 'CF/Org/Space' : 'Org/Space')
    );
  }

  getValue(): Observable<string> {
    return combineLatest([
      this.cf$,
      this.org$,
      this.space$,
      this.multipleConnectedEndpoints$
    ]).pipe(
      filter(([cf, org, space]) => !!cf && !!org && !!space),
      take(1),
      map(([cf, org, space, multipleConnectedEndpoints]) =>
        multipleConnectedEndpoints
          ? `${cf!.name}/${org!.entity.name}/${space!.entity.name}`
          : `${org!.entity.name}/${space!.entity.name}`
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
