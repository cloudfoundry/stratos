import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { map, switchMap } from 'rxjs/operators';
import { AppState } from '../store/app-state';
import { getCurrentUserCFEndpointRolesState } from '../store/selectors/current-user-roles-permissions-selectors/role.selectors';
import { IOrgRoleState, ISpaceRoleState } from '../store/types/current-user-roles.types';
import {
  CurrentUserPermissions, PermissionStrings, PermissionTypes, permissionConfigs, PermissionConfig
} from './current-user-permissions.config';
import { combineLatest } from 'rxjs/observable/combineLatest';
import { filter } from 'rxjs/operators';
import { endpointsRegisteredEntitiesSelector } from '../store/selectors/endpoint.selectors';
@Injectable()
export class CurrentUserPermissionsService {

  constructor(private store: Store<AppState>) { }

  public can(action: CurrentUserPermissions, endpointGuid?: string, orgOrSpaceGuid?: string): Observable<boolean> {
    const actionConfig = permissionConfigs[action];
    if (!actionConfig) {
      return Observable.of(false);
    }
    const perissionObservables: Observable<boolean>[] = actionConfig.map(config => {
      return this.generateChecks(config, endpointGuid, orgOrSpaceGuid);
      // if (!guid && permission !== PermissionStrings._GLOBAL_) {
      //   const check$ = endpointGuid ? this.checkAllOfType(endpointGuid, type, permission);
      //   return this.applyAdminCheck(check$, endpointGuid);
      // }
    });
    return combineLatest(perissionObservables).pipe(
      map(allChecks => {
        return allChecks.some(check => check);
      })
    );
  }

  private generateChecks(config: PermissionConfig, endpointGuid?: string, orgOrSpaceGuid?: string) {
    const { type, permission } = config;
    const endpointGuids$ = !endpointGuid ? this.getAllEndpointGuids() : Observable.of([endpointGuid]);
    if (!orgOrSpaceGuid) {
      return endpointGuids$.pipe(
        switchMap(guids => {
          return combineLatest(guids.map(guid => this.checkAllOfType(guid, type, permission))).pipe(
            map(checks => checks.some(check => check))
          );
        })
      );
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

  private applyAdminCheck(check$: Observable<boolean>, endpointGuid: string) {
    return this.store.select(getCurrentUserCFEndpointRolesState(endpointGuid)).pipe(
      switchMap(cfPermissions => {
        if (cfPermissions.global.isAdmin) {
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

  private selectPermission(state: IOrgRoleState | ISpaceRoleState, permission: PermissionStrings) {
    return state[permission] || false;
  }

}
