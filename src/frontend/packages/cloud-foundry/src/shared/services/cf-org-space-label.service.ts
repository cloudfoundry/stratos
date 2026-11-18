import { computed, Signal } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { APIResource, EndpointModel } from '@stratosui/store';
import { EndpointsSignalService } from '@stratosui/core';
import { IOrganization, ISpace } from '../../cf-api.types';
import { CF_ENDPOINT_TYPE } from '../../cf-types';
import { cfOsDebugLog } from '../data-services/cf-org-space-debug';

/**
 * Signal-native projection of the CF/org/space breadcrumb labels.
 *
 * The CF endpoint name is sourced from {@link EndpointsSignalService} rather
 * than the legacy ngrx `store.select(selectEntity(...))`. The public
 * name getters stay Observables; `multipleConnectedEndpoints` is a signal
 * over the connected Cloud Foundry endpoints.
 *
 * Org/space resolution was only ever exercised by the now-dead app cells
 * (`card-app`, `TableCellAppCfOrgSpaceBase`, slated for workstream D); the
 * live breadcrumb path (cf-service-card cluster) passes only `cfGuid`, so
 * org/space stay empty exactly as they did under ngrx.
 */
export class CfOrgSpaceLabelService {

  /** True while more than one Cloud Foundry endpoint is connected. */
  public readonly multipleConnectedEndpoints: Signal<boolean>;
  private org$: Observable<APIResource<IOrganization> | null> = of(null);
  private space$: Observable<APIResource<ISpace> | null> = of(null);

  /**
   * @param endpoints Signal-native endpoints projection (CF name source)
   * @param cfGuid Used by the URL builders and name getters
   * @param orgGuid Used by the URL builders and name getters
   * @param spaceGuid Used by the URL builders and name getters
   */
  constructor(
    private endpoints: EndpointsSignalService,
    private cfGuid?: string,
    private orgGuid?: string,
    private spaceGuid?: string) {
    cfOsDebugLog('labelService:construct', { cfGuid, orgGuid, spaceGuid });

    this.multipleConnectedEndpoints = computed(() =>
      Object.values(this.endpoints.endpoints()).filter(e =>
        e.cnsi_type === CF_ENDPOINT_TYPE && e.connectionStatus === 'connected').length > 1);
  }

  // Read the endpoints signal on each access so the async-pipe binding picks
  // up the CF entity once the endpoints slice has hydrated.
  private get cf$(): Observable<EndpointModel | null> {
    return of(this.cfGuid ? this.endpoints.endpoints()[this.cfGuid] ?? null : null);
  }

  getCfURL = () => ['/cloud-foundry', this.cfGuid, 'summary'];
  getCfName = () => this.cf$.pipe(map(cf => cf ? cf.name : ''));

  getOrgURL = () => ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'summary'];
  getOrgName = () => this.org$.pipe(map(org => org ? org.entity.name : ''));

  getSpaceURL = () => ['/cloud-foundry', this.cfGuid, 'organizations', this.orgGuid, 'spaces', this.spaceGuid, 'summary'];
  getSpaceName = () => this.space$.pipe(map(space => space ? space.entity.name : ''));
}
