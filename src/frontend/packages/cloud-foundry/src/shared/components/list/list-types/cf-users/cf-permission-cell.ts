import { Directive, Input } from '@angular/core';
import { Store } from '@ngrx/store';
import { BehaviorSubject, type Observable, of as observableOf } from 'rxjs';
import { filter, first, map, switchMap } from 'rxjs/operators';

import { AppChip, ConfirmationDialogConfig, ConfirmationDialogService, TableCellCustom } from '@stratosui/core';
import { type APIResource, selectSessionData } from '@stratosui/store';
import { type CFAppState, type CfUser, type IUserRole, UserRoleLabels } from '@stratosui/cloud-foundry';
import type { CfUserService } from '../../../../data-services/cf-user.service';


export interface ICellPermissionList<T> extends IUserRole<T> {
  busy: Observable<boolean>;
  name: string;
  guid: string;
  userGuid: string;
  username?: string;
  cfGuid: string;
  orgGuid: string;
  spaceGuid?: string;
}

export interface ICellPermissionConfig {
  cfGuid: string;
  cfOrgSpace?: unknown;
  org$?: Observable<unknown>;
  spaces$?: Observable<unknown>;
  isOrgLevel?: boolean;
}

@Directive()
export abstract class CfPermissionCellDirective<T> extends TableCellCustom<APIResource<CfUser>> {
  userEntity: BehaviorSubject<CfUser> = new BehaviorSubject(null);

  @Input('row')
  set row(row: APIResource<CfUser>) {
    super.row = row;
    this.rowSubject.next(row);
    this.guid = row.metadata.guid;
    this.userEntity.next(row.entity);
  }

  @Input()
  set config(config: ICellPermissionConfig) {
    super.config = config;
    this.configSubject.next(config);
  }

  public chipsConfig$: Observable<AppChip<ICellPermissionList<T>>[]>;
  protected guid: string;

  protected rowSubject = new BehaviorSubject<APIResource<CfUser>>(null);
  private configSubject = new BehaviorSubject<ICellPermissionConfig | null>(null);
  protected config$ = this.configSubject.asObservable().pipe(
    filter(config => !!config)
  ) as Observable<ICellPermissionConfig>;

  constructor(
    public store: Store,
    private confirmDialog: ConfirmationDialogService,
    public cfUserService: CfUserService
  ) {
    super();
  }

  protected getChipConfig(cellPermissionList: ICellPermissionList<T>[]) {
    return cellPermissionList.map(perm => {
      const chipConfig = new AppChip<ICellPermissionList<T>>();
      chipConfig.key = perm;
      chipConfig.value = this.permissionString(perm);
      chipConfig.busy = perm.busy;
      chipConfig.clearAction = chip => {
        const permission = chip.key;
        this.removePermissionWarn(permission);
      };
      chipConfig.hideClearButton$ = this.canRemovePermission(perm.cfGuid, perm.orgGuid, perm.spaceGuid).pipe(
        map(can => !can),
        switchMap(hide => {
          if (!hide) {
            if (perm.string === UserRoleLabels.org.short.users) {
              // If there are other roles than Org User, disable clear button
              return this.userEntity.pipe(
                filter(p => !!p),
                map((entity: CfUser) => this.cfUserService.hasRolesInOrg(entity, perm.orgGuid, true)),
              );
            }
          }
          return observableOf(hide);
        })
      );
      return chipConfig;
    });
  }

  protected removePermissionWarn(cellPermission: ICellPermissionList<T>) {
    const confirmation = new ConfirmationDialogConfig(
      'Remove Permission',
      `Are you sure you want to remove permission '${this.permissionString(cellPermission)}'` +
      ` from user '${cellPermission.username}'?`,
      'Delete',
      true
    );
    this.confirmDialog.open(confirmation, () => {
      this.store.select(selectSessionData()).pipe(
        first()
      ).subscribe(sessionData => {
        const cfSession = sessionData.endpoints.cf[cellPermission.cfGuid];
        const updateConnectedUser = !cfSession.user.admin && cellPermission.userGuid === cfSession.user.guid;
        this.removePermission(cellPermission, updateConnectedUser);
      });
    });
  }

  private permissionString(perm: ICellPermissionList<T>): string {
    return perm.name ? `${perm.name}: ${perm.string}` : perm.string;
  }

  protected removePermission(_cellPermission: ICellPermissionList<T>, _updateConnectedUser: boolean) {

  }

  protected canRemovePermission = (_cfGuid: string, _orgGuid: string, _spaceGuid: string): Observable<boolean> => observableOf(false);
}
