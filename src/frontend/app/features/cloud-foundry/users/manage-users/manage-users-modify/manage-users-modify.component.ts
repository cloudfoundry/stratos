import {
  Component,
  ComponentFactory,
  ComponentFactoryResolver,
  ComponentRef,
  OnInit,
  ViewChild,
  ViewContainerRef,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs/Observable';
import { debounceTime, distinctUntilChanged, filter, first, map, switchMap } from 'rxjs/operators';

import { IOrganization } from '../../../../../core/cf-api.types';
import { PaginationMonitorFactory } from '../../../../../shared/monitors/pagination-monitor.factory';
import { GetAllOrganizations } from '../../../../../store/actions/organization.actions';
import { UsersRolesSetOrg } from '../../../../../store/actions/users-roles.actions';
import { AppState } from '../../../../../store/app-state';
import { entityFactory, organizationSchemaKey, spaceSchemaKey } from '../../../../../store/helpers/entity-factory';
import { createEntityRelationKey, createEntityRelationPaginationKey } from '../../../../../store/helpers/entity-relations.types';
import { getPaginationObservables } from '../../../../../store/reducers/pagination-reducer/pagination-reducer.helper';
import { selectUsersRolesPicked, selectUsersRolesRoles } from '../../../../../store/selectors/users-roles.selector';
import { APIResource } from '../../../../../store/types/api.types';
import { CfUser, OrgUserRoleNames } from '../../../../../store/types/user.types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';


@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  entryComponents: [SpaceRolesListWrapperComponent]
})
export class UsersRolesModifyComponent implements OnInit {

  // @Input() initialUsers$: Observable<CfUser[]>;

  @ViewChild('spaceRolesTable', { read: ViewContainerRef })
  spaceRolesTable: ViewContainerRef;

  private wrapperFactory: ComponentFactory<SpaceRolesListWrapperComponent>;
  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;

  singleOrg$: Observable<APIResource<IOrganization>>;
  organizations$: Observable<APIResource<IOrganization>[]>;
  selectedOrgGuid: string;
  users$: Observable<CfUser[]>;
  blocked$: Observable<boolean>;
  valid$: Observable<boolean>;
  orgRoles = OrgUserRoleNames;

  constructor(
    private store: Store<AppState>,
    private activeRouteCfOrgSpace: ActiveRouteCfOrgSpace,
    private paginationMonitorFactory: PaginationMonitorFactory,
    private componentFactoryResolver: ComponentFactoryResolver,
    private cfRolesService: CfRolesService) {
    this.wrapperFactory = this.componentFactoryResolver.resolveComponentFactory(SpaceRolesListWrapperComponent);
  }

  ngOnInit() {
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.singleOrg$ = this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid);
      this.singleOrg$.pipe(
        first()
      ).subscribe(null, null, () => {
        this.updateOrg(this.activeRouteCfOrgSpace.orgGuid);
      });
    } else {
      this.singleOrg$ = Observable.of(null);
      const paginationKey = createEntityRelationPaginationKey(organizationSchemaKey, this.activeRouteCfOrgSpace.cfGuid);
      this.organizations$ = getPaginationObservables<APIResource<IOrganization>>({
        store: this.store,
        action: new GetAllOrganizations(paginationKey, this.activeRouteCfOrgSpace.cfGuid, [
          createEntityRelationKey(organizationSchemaKey, spaceSchemaKey)
        ], true),
        paginationMonitor: this.paginationMonitorFactory.create(
          paginationKey,
          entityFactory(organizationSchemaKey)
        ),
      },
        true
      ).entities$.pipe(
        map(orgs => orgs.sort((a, b) => a.entity.name.localeCompare(b.entity.name)))
      );
      this.organizations$.pipe(
        filter(orgs => orgs && !!orgs.length),
        first()
      ).subscribe(orgs => {
        this.updateOrg(orgs[0].metadata.guid);
      });
    }
    this.users$ = this.store.select(selectUsersRolesPicked).pipe(
      distinctUntilChanged(),
    );

    this.valid$ = this.store.select(selectUsersRolesRoles).pipe(
      debounceTime(150),
      switchMap(orgRoles => this.cfRolesService.createRolesDiff(orgRoles.orgGuid)),
      map(changes => !!changes.length)
    );
  }

  updateOrg(orgGuid) {
    this.selectedOrgGuid = orgGuid;
    if (!orgGuid) {
      return;
    }

    this.store.dispatch(new UsersRolesSetOrg(orgGuid));
    this.store.select(selectUsersRolesRoles).pipe(
      filter(newRoles => newRoles && newRoles.orgGuid === orgGuid),
      first()
    ).subscribe(null, null, () => {
      if (this.wrapperRef) {
        this.wrapperRef.destroy();
      }
      if (this.spaceRolesTable) {
        this.spaceRolesTable.clear();
      }
      this.wrapperRef = this.spaceRolesTable.createComponent(this.wrapperFactory);
    });
  }

  onNext = () => {
    return this.cfRolesService.createRolesDiff(this.selectedOrgGuid).pipe(
      map(() => {
        return { success: true };
      })
    ).catch(err => {
      return Observable.of({ success: false });
    });
  }
}
