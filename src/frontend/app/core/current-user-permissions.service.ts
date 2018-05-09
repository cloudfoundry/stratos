import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, switchMap, tap } from 'rxjs/operators';
import { AppState } from '../store/app-state';
import { getCurrentUserCFEndpointRolesState } from '../store/selectors/current-user-roles-permissions-selectors/role.selectors';
import { IOrgRoleState, ISpaceRoleState } from '../store/types/current-user-roles.types';
import {
  CurrentUserPermissions,
  PermissionStrings,
  PermissionTypes,
  permissionConfigs,
  PermissionConfig,
  PermissionConfigLink,
  PermissionConfigType
} from './current-user-permissions.config';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter } from 'rxjs/operators';
import { endpointsRegisteredEntitiesSelector } from '../store/selectors/endpoint.selectors';
@Injectable()
export class CurrentUserPermissionsService {

  constructor(private store: Store<AppState>) { }

  public can(action: CurrentUserPermissions, endpointGuid?: string, orgOrSpaceGuid?: string, spaceGuid?: string): Observable<boolean> {
    const actionConfig = this.getConfig(permissionConfigs[action]);
    if (!actionConfig && !actionConfig.length) {
      return endpointGuid ? this.getAdminCheck(endpointGuid) : Observable.of(false);
    }
    const permissionObservables: Observable<boolean>[] = actionConfig.map(config => {
      const { type } = config;
      return this.generateChecks(config, endpointGuid, type === PermissionTypes.SPACE && spaceGuid ? spaceGuid : orgOrSpaceGuid);
      // if (!guid && permission !== PermissionStrings._GLOBAL_) {
      //   const check$ = endpointGuid ? this.checkAllOfType(endpointGuid, type, permission);
      //   return this.applyAdminCheck(check$, endpointGuid);
      // }
    });
    return combineLatest(permissionObservables).pipe(
      map(allChecks => {
        return allChecks.some(check => check);
      })
    );
  }

  private generateChecks(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string) {
    const { type, permission } = config;
    if (!orgOrSpaceGuid) {
      const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
      return endpointGuids$.pipe(
        switchMap(guids => {
          return combineLatest(guids.map(guid => {
            const checks$ = this.checkAllOfType(guid, type, permission);
            return this.applyAdminCheck(checks$, guid);
          })).pipe(
            map(checks => checks.some(check => check))
          );
        })
      );
    } else if (endpointGuid && orgOrSpaceGuid) {
      const check$ = this.check(endpointGuid, orgOrSpaceGuid, type, permission);
      return this.applyAdminCheck(check$, endpointGuid).pipe(tap(console.log));
    }
    return Observable.of(false);
  }

  private getAllEndpointGuids() {
    return this.store.select(endpointsRegisteredEntitiesSelector).pipe(
      map(endpoints => Object.values(endpoints).filter(e => e.cnsi_type === 'cf').map(endpoint => endpoint.guid))
    );
  }

  private checkAllCfEndpoints(type: PermissionTypes, permission: PermissionStrings) {
    return Observable.of(false);
  }

  private getAdminCheck(endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      map(cfPermissions => cfPermissions.global.isAdmin)
    );
  }

  private applyAdminCheck(check$: Observable<boolean>, endpointGuid: string) {
    return this.getAdminCheck(endpointGuid).pipe(
      switchMap(isAdmin => {
        if (isAdmin) {
          return Observable.of(true);
        }
        return check$;
      })
    );
  }

  private checkAllOfType(endpointGuid: string, type: PermissionTypes, permission: PermissionStrings) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      filter(state => !!state),
      map(state => {
        if (!state[type]) {
          return false;
        }
        return Object.keys(state[type]).some(guid => {
          return this.selectPermission(state[type][guid], permission);
        });
      })
    );
  }

  private check(endpointGuid: string, orgOrSpaceGuid: string, type: PermissionTypes, permission: PermissionStrings) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      filter(state => !!state),
      map(state => state[type][orgOrSpaceGuid]),
      tap(() => console.log(type, orgOrSpaceGuid)),
      map(state => this.selectPermission(state, permission)),
    );
  }

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings) {
    console.log(state, permission);
    return state[permission] || false;
  }

  private getConfig(config: PermissionConfigType, _tries = 0): PermissionConfig[] {
    const linkConfig = config as PermissionConfigLink;
    if (linkConfig.link) {
      if (_tries >= 20) {
        // Tried too many times to get permission config, circular reference very likely.
        return;
      }
      ++_tries;
      return this.getLinkedPermissionConfig(linkConfig, _tries);
    } else {
      return config as PermissionConfig[];
    }
  }

  private getLinkedPermissionConfig(linkConfig: PermissionConfigLink, _tries = 0) {
    return this.getConfig(permissionConfigs[linkConfig.link]);
  }

}
