import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, ComponentRef, Input, OnDestroy, OnInit, ViewChild, ViewContainerRef, signal, computed, Signal, WritableSignal, ChangeDetectionStrategy, inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { combineLatest, Observable, of as observableOf, Subscription } from 'rxjs';
import { take,
  catchError,
  debounceTime,
  delay,
  distinctUntilChanged,
  filter,
  defaultIfEmpty,
  map,
  share,
  startWith,
  switchMap,
  tap,
} from 'rxjs/operators';

import {
  TailwindSnackBarService,
  TailwindSnackBarRef,
  EnumerateComponent,
  SignalListColumn,
  SignalListComponent,
  SignalListConfig,
  SignalListCellTemplateDirective,
} from '@stratosui/core';
import { getRowMetadata, APIResource } from '@stratosui/store';
import { IOrganization } from '../../../../../cf-api.types';
import { CfRoleCheckboxComponent } from '../../../../../shared/components/cf-role-checkbox/cf-role-checkbox.component';
import {
  TableCellSelectOrgComponent,
} from '../../../../../shared/components/list/list-types/cf-users-org-space-roles/table-cell-select-org/table-cell-select-org.component';
import { CfUsersRolesDataService } from '../../../../../services/domain-data/cf-users-roles-data.service';
import { OrgUserRoleNames } from '../../../../../store/types/cf-user.types';
import { StUser } from '../../../../../services/endpoint-data/stratos-types';
import { ActiveRouteCfOrgSpace } from '../../../cf-page.types';
import { CfRolesService } from '../cf-roles.service';
import { SpaceRolesListWrapperComponent } from './space-roles-list-wrapper/space-roles-list-wrapper.component';

interface CfUserWithWarning extends StUser {
  showWarning: boolean;
}

@Component({
  selector: 'app-manage-users-modify',
  templateUrl: './manage-users-modify.component.html',
  styleUrls: ['./manage-users-modify.component.scss'],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    EnumerateComponent,
    SignalListComponent,
    SignalListCellTemplateDirective,
    TableCellSelectOrgComponent,
    CfRoleCheckboxComponent,
  ]
})
export class UsersRolesModifyComponent implements OnInit, OnDestroy {
  private activeRouteCfOrgSpace = inject(ActiveRouteCfOrgSpace);
  private cfRolesService = inject(CfRolesService);
  private cd = inject(ChangeDetectorRef);
  private snackBar = inject(TailwindSnackBarService);
  private rolesData = inject(CfUsersRolesDataService);
  // Cache the rxjs bridges in the constructor so handlers and ngOnInit
  // can reuse them without needing the injection context that toObservable
  // requires. orgGuid$/picked$/newRoles$/isRemove$ are stable per service
  // instance and emit synchronously through the underlying signal.
  private orgGuid$ = toObservable(this.rolesData.orgGuid);
  private picked$ = toObservable(this.rolesData.users);
  private newRoles$ = toObservable(this.rolesData.newRoles);
  private isRemove$$ = toObservable(this.rolesData.isRemove);
  private isSetByUsername$$ = toObservable(this.rolesData.isSetByUsername);



  @Input() setUsernames = false;

  // ── Org table (signal-list) ───────────────────────────────────────────
  // The org table is a single row — the selected org — with the org-select
  // cell plus a role checkbox per org role. Rows + loading are pushed from
  // the orgConnect$/isTableLoading$ chains built in ngOnInit.
  private readonly orgRows: WritableSignal<APIResource<IOrganization>[]> = signal([]);
  private readonly orgLoading: WritableSignal<boolean> = signal(true);
  private readonly orgPageIndex: WritableSignal<number> = signal(0);
  private readonly orgPageSize: WritableSignal<number> = signal(100);
  private readonly orgTotal: Signal<number> = computed(() => this.orgRows().length);
  private readonly orgTotalPages: Signal<number> = computed(() => {
    const size = this.orgPageSize();
    return size > 0 ? Math.max(1, Math.ceil(this.orgTotal() / size)) : 1;
  });
  private readonly orgPagedItems: Signal<APIResource<IOrganization>[]> = computed(() => {
    const size = this.orgPageSize();
    const idx = this.orgPageIndex();
    return this.orgRows().slice(idx * size, idx * size + size);
  });

  listConfig: SignalListConfig<APIResource<IOrganization>> = {
    pagedItems: this.orgPagedItems,
    totalFilteredResults: this.orgTotal,
    totalPages: this.orgTotalPages,
    pageIndex: this.orgPageIndex,
    pageSize: this.orgPageSize,
    hidePagerWhenSingle: true,
    isAnyLoading: this.orgLoading,
    errorsByCnsi: signal(new Map()),
    getRowKey: (row: APIResource<IOrganization>) => getRowMetadata(row),
    columns: this.buildOrgColumns(),
  };

  private buildOrgColumns(): SignalListColumn<APIResource<IOrganization>>[] {
    return [
      { header: 'Organization', key: 'org', kind: 'template', templateName: 'org',
        render: (row: APIResource<IOrganization>) => row.entity.name },
      { header: 'Manager', key: 'manager', kind: 'template', templateName: 'manager', render: () => '' },
      { header: 'Auditor', key: 'auditor', kind: 'template', templateName: 'auditor', render: () => '' },
      { header: 'Billing Manager', key: 'billingManager', kind: 'template', templateName: 'billingManager', render: () => '' },
      { header: 'User', key: 'user', kind: 'template', templateName: 'user', render: () => '' },
    ];
  }

  private orgSubs: Subscription[] = [];

  @ViewChild('spaceRolesTable', { read: ViewContainerRef, static: true })
  spaceRolesTable!: ViewContainerRef;

  private wrapperRef: ComponentRef<SpaceRolesListWrapperComponent>;
  private snackBarRef: TailwindSnackBarRef<any>;

  usersNames$!: Observable<string[]>;
  blocked = signal<boolean>(true);
  blocked$: Observable<boolean> = toObservable(this.blocked).pipe(delay(0));
  valid$!: Observable<boolean>;
  orgRoles = OrgUserRoleNames;
  selectedOrgGuid!: string;
  orgGuidChangedSub!: Subscription;
  usersWithWarning$!: Observable<string[]>;
  isSetByUsername$!: Observable<boolean | undefined>;
  isRemove$!: Observable<boolean | undefined>;

  ngOnInit() {
    if (this.setUsernames) {
      this.blocked.set(false);
    } else {
      this.cfRolesService.loading$.subscribe(loading => this.blocked.set(loading));
    }

    const orgEntity$ = this.orgGuid$.pipe(
      startWith(''),
      distinctUntilChanged(),
      filter(orgGuid => !!orgGuid),
      tap(orgGuid => this.updateOrg(orgGuid)),
      switchMap(orgGuid => this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, orgGuid)),
      share()
    );

    const orgConnect$ = orgEntity$.pipe(
      filter(entityInfo => !!entityInfo.entity),
      map(entityInfo => [entityInfo.entity]),
      share()
    );

    const isTableLoading$ = orgEntity$.pipe(
      map(orgEntity => orgEntity.entityRequestInfo.fetching),
      startWith(true)
    );
    // Feed the signal-list: orgConnect$ emits a single-element array (the
    // selected org), isTableLoading$ tracks the fetch.
    this.orgSubs.push(orgConnect$.subscribe(rows => this.orgRows.set(rows ?? [])));
    this.orgSubs.push(isTableLoading$.subscribe(loading => this.orgLoading.set(loading)));

    // Set the starting state of the org table
    if (this.activeRouteCfOrgSpace.orgGuid) {
      this.cfRolesService.fetchOrg(this.activeRouteCfOrgSpace.cfGuid, this.activeRouteCfOrgSpace.orgGuid).pipe(
        take(1),
        defaultIfEmpty(null)
      ).subscribe(org => {
        if (org) { this.rolesData.setOrg(this.activeRouteCfOrgSpace.orgGuid, org.entity.entity.name); }
      });
    } else {
      this.orgGuidChangedSub = this.cfRolesService.fetchOrgs(this.activeRouteCfOrgSpace.cfGuid).pipe(
        filter(orgs => orgs && !!orgs.length),
        take(1)
      ).subscribe(orgs => {
        if (orgs[0]?.metadata?.guid && orgs[0]?.entity?.name) {
          this.rolesData.setOrg(orgs[0].metadata.guid, orgs[0].entity.name);
        }
      });
    }

    const users$: Observable<CfUserWithWarning[]> = this.picked$.pipe(
      filter(users => !!users),
      distinctUntilChanged(),
      map(users => users.map(this.mapUser.bind(this)))
    );

    this.usersNames$ = users$.pipe(
      map(users => users.map(user => user.showWarning ? '*' + user.username : user.username))
    );

    this.usersWithWarning$ = users$.pipe(
      map(users => users.filter(user => !!user.showWarning).map(user => user.username))
    );

    this.valid$ = this.newRoles$.pipe(
      debounceTime(150),
      switchMap(newRoles => this.cfRolesService.createRolesDiff(newRoles?.orgGuid)),
      map(changes => !!changes.length)
    );

    this.isSetByUsername$ = this.isSetByUsername$$;
    this.isRemove$ = this.isRemove$$;
  }

  private mapUser(user: StUser): CfUserWithWarning {
    // If we're at the org level or lower we guarantee org roles. If we're at
    // the space we guarantee space roles.
    //
    // `missingRoles` was a v2-era artifact stamped by the ngrx cf-users
    // reducer when a user was fetched without its full org/space relation
    // tree. StUser is always the fully-drained native row (every scope's
    // role buckets present), so there's never a partial-fetch warning —
    // showWarning is therefore always false. The warning machinery (snackbar
    // + '*' prefix) is preserved so the affordance reappears for free if a
    // partial-fetch shape is ever reintroduced.
    const missingRoles = (user as { missingRoles?: { org: unknown[]; space: unknown[] } }).missingRoles;
    const showWarning = !!missingRoles &&
      ((!!missingRoles.org.length && !this.activeRouteCfOrgSpace.orgGuid) ||
        (!!missingRoles.space.length && !this.activeRouteCfOrgSpace.spaceGuid));
    // Ensure we're in an object where the username is always populated (in some cases it's missing)
    const newUser = {
      ...user,
      showWarning,
      username: user.username || user.guid
    };
    return newUser;
  }

  private destroySpacesList() {
    if (this.wrapperRef) {
      this.wrapperRef.destroy();
    }
    if (this.spaceRolesTable) {
      this.spaceRolesTable.clear();
    }
  }

  ngOnDestroy() {
    if (this.orgGuidChangedSub) {
      this.orgGuidChangedSub.unsubscribe();
    }
    this.orgSubs.forEach(s => s.unsubscribe());
    this.destroySpacesList();
    if (this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  }

  updateOrg(orgGuid: string) {
    this.selectedOrgGuid = orgGuid;
    if (!this.selectedOrgGuid) {
      return;
    }

    // When the state is ready (org guid is correct), recreate the space roles table for the selected org
    this.newRoles$.pipe(
      // Wait for the store to have the correct org
      filter(newRoles => !!newRoles && newRoles.orgGuid === orgGuid),
      take(1)
    ).subscribe({
      complete: () => {
        // The org has changed, completely recreate the roles table
        this.destroySpacesList();

        this.wrapperRef = this.spaceRolesTable.createComponent(SpaceRolesListWrapperComponent);
        this.cd.detectChanges();
      }
    });
  }

  onEnter = () => {
    if (!this.snackBarRef) {
      this.usersWithWarning$.pipe(take(1)).subscribe((usersWithWarning => {
        if (usersWithWarning && usersWithWarning.length) {
          this.snackBarRef = this.snackBar.open(`Not all roles are shown for user/s - ${usersWithWarning.join(', ')}. To avoid this please
          navigate to a specific organization or space`, 'Dismiss');
        }
      }));
    }

    // In order to show the removed roles correctly (as ticks) flip them from remove to add
    this.isRemove$$.pipe(take(1)).subscribe(isRemove => {
      if (isRemove) {
        this.rolesData.flipSetRoles();
      }
    });
  };

  onLeave = (isNext: boolean) => {
    if (!isNext && this.snackBarRef) {
      this.snackBarRef.dismiss();
      this.snackBarRef = null;
    }
  };

  onNext = () => {
    return combineLatest([
      this.isRemove$$.pipe(take(1)),
      this.cfRolesService.createRolesDiff(this.selectedOrgGuid)
    ]).pipe(
      map(([isRemove]) => {
        if (isRemove) {
          // If we're going to eventually remove the roles flip the add to remove
          this.rolesData.flipSetRoles();
        }
        return { success: true };
      })
    ).pipe(catchError(_err => {
      return observableOf({ success: false });
    }));
  };

}
