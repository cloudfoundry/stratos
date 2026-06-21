import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { Subscription, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';

import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';
import { APIResource } from '../../../../../store/src/types/api.types';
import { IOrganization } from '../../../cf-api.types';
import { CfRolesService } from '../../../features/cf/users/manage-users/cf-roles.service';
import { StUser } from '../../../services/endpoint-data/stratos-types';
import { OrgUserRoleNames, SpaceUserRoleNames } from '../../../store/types/cf-user.types';
import { CfRoleChange, CfUserRolesSelected } from '../../../store/types/users-roles.types';
import { CfCurrentUserPermissions } from '../../../user-permissions/cf-user-permissions-checkers';
import { ORG_ROLE_DEFS, SPACE_ROLE_DEFS, shortLabelOfScoped } from '../../../roles/role-registry';
import { RoleTristateCheckboxComponent } from './role-tristate-checkbox.component';
import {
  RoleSelection,
  computeChecked,
  diffToChanges,
} from './role-tristate';

interface OrgDef {
  name: OrgUserRoleNames;
  label: string;
}

interface SpaceDef {
  name: SpaceUserRoleNames;
  label: string;
}

interface SpaceEntry {
  guid: string;
  name: string;
}

@Component({
  selector: 'app-role-assignment',
  standalone: true,
  templateUrl: './role-assignment.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RoleTristateCheckboxComponent],
})
export class RoleAssignmentComponent implements OnInit, OnDestroy {
  @Input({ required: true }) cfGuid!: string;
  readonly users = input<StUser[]>([]);
  readonly baseline = input<CfUserRolesSelected>({});
  @Input() lockedOrg?: { guid: string; name: string };

  @Output() changeSet = new EventEmitter<CfRoleChange[]>();

  // --- Role definitions ---

  /** Exposed for template: enum-safe reference used to disable the org-user checkbox */
  protected readonly orgUserRole = OrgUserRoleNames.USER;

  readonly orgRoleDefs: OrgDef[] = ORG_ROLE_DEFS.map(d => ({
    name: d.stratos as OrgUserRoleNames,
    label: shortLabelOfScoped(d.stratos),
  }));

  readonly spaceRoleDefs: SpaceDef[] = SPACE_ROLE_DEFS.map(d => ({
    name: d.stratos as SpaceUserRoleNames,
    label: shortLabelOfScoped(d.stratos),
  }));

  // --- Injected services ---
  private readonly cfRolesService = inject(CfRolesService);
  private readonly userPerms = inject(CurrentUserPermissionsService);

  // --- Internal signals ---
  /** All orgs fetched (before permission filter) */
  private readonly allOrgs = signal<APIResource<IOrganization>[]>([]);

  /** Permission map: orgGuid → can edit */
  private readonly canEditByOrg = signal<Record<string, boolean>>({});

  /** Orgs the picker offers.
   *
   * fetchOrgs already applies the broadened filter (ORGANIZATION_CHANGE_ROLES OR
   * SPACE_CHANGE_ROLES on any space within the org), so allOrgs is the correct
   * admissible set.  We do NOT re-narrow here by canEditByOrg — that would
   * exclude space-manager-only users whose org-level check is false.
   * canEditByOrg is still used for org-cell gating (concern #1).
   */
  readonly allowedOrgs = computed(() => this.allOrgs());

  /** Per-space permission map: `${orgGuid}:${spaceGuid}` → can change space roles */
  private readonly canChangeSpaceByKey = signal<Record<string, boolean>>({});

  /** The orgs the user has selected (or the locked org) */
  readonly pickedOrgs = signal<APIResource<IOrganization>[]>([]);

  /** Accordion open/closed per orgGuid — presentational, never affects selection */
  private readonly expandedByOrg = signal<Set<string>>(new Set());

  /** Space filter text per orgGuid — presentational only */
  private readonly spaceFilterByOrg = signal<Record<string, string>>({});

  /** Spaces loaded per orgGuid */
  private readonly spacesByOrg = signal<Record<string, SpaceEntry[]>>({});

  /** The user's explicit role edits (overlay on baseline) */
  private readonly selection = signal<RoleSelection>({});

  /** Org search text for the multi-select picker */
  readonly orgSearchText = signal('');

  /** Orgs visible in the picker (allowed + search filter) */
  readonly filteredAllowedOrgs = computed(() => {
    const search = this.orgSearchText().toLowerCase();
    if (!search) {
      return this.allowedOrgs();
    }
    return this.allowedOrgs().filter(o => o.entity.name.toLowerCase().includes(search));
  });

  private subs = new Subscription();

  // --- Lifecycle ---

  ngOnInit(): void {
    // Fetch all orgs, then resolve permissions per org
    const orgsSub = this.cfRolesService.fetchOrgs(this.cfGuid).subscribe(orgs => {
      this.allOrgs.set(orgs);
      this.resolvePermissions(orgs);
    });
    this.subs.add(orgsSub);

    // lockedOrg: seed pickedOrgs from it once orgs load (or immediately if lockedOrg is set)
    if (this.lockedOrg) {
      // We create a minimal APIResource shape from the lockedOrg hint
      // We'll wait for allOrgs to fill so we get the real entity, or use stub
      this.seedLockedOrg();
    }
  }

  ngOnDestroy(): void {
    this.subs.unsubscribe();
  }

  // --- Permission resolution ---

  private resolvePermissions(orgs: APIResource<IOrganization>[]): void {
    if (!orgs.length) {
      return;
    }
    // Build one combineLatest over all per-org observables, resolve once
    const obs = orgs.map(o =>
      this.userPerms.can(CfCurrentUserPermissions.ORGANIZATION_CHANGE_ROLES, this.cfGuid, o.metadata.guid).pipe(
        map(can => ({ guid: o.metadata.guid, can })),
      ),
    );

    const permSub = combineLatest(obs).subscribe(results => {
      const map: Record<string, boolean> = {};
      for (const { guid, can } of results) {
        map[guid] = can;
      }
      this.canEditByOrg.set(map);

      // If lockedOrg is set, seed from real org list once permissions resolved
      if (this.lockedOrg && this.pickedOrgs().length === 0) {
        this.seedLockedOrg();
      }
    });
    this.subs.add(permSub);
  }

  // --- Locked org seeding ---

  private seedLockedOrg(): void {
    if (!this.lockedOrg) {
      return;
    }
    const existing = this.allOrgs().find(o => o.metadata.guid === this.lockedOrg!.guid);
    if (existing) {
      this.pickedOrgs.set([existing]);
      this.loadSpacesFor(existing.metadata.guid);
      this.expandedByOrg.update(set => { const next = new Set(set); next.add(existing.metadata.guid); return next; });
    } else {
      // Org not yet loaded — create a stub so the UI can render
      const stub: APIResource<IOrganization> = {
        metadata: {
          guid: this.lockedOrg.guid,
          created_at: '',
          updated_at: '',
          url: '',
        },
        entity: { name: this.lockedOrg.name },
      };
      this.pickedOrgs.set([stub]);
      this.loadSpacesFor(this.lockedOrg.guid);
      this.expandedByOrg.update(set => { const next = new Set(set); next.add(this.lockedOrg!.guid); return next; });
    }
  }

  // --- Org picker actions ---

  pickOrg(org: APIResource<IOrganization>): void {
    const already = this.pickedOrgs().some(o => o.metadata.guid === org.metadata.guid);
    if (already) {
      return;
    }
    this.pickedOrgs.update(list => [...list, org]);
    this.loadSpacesFor(org.metadata.guid);
    this.expandedByOrg.update(set => { const next = new Set(set); next.add(org.metadata.guid); return next; });
  }

  removePickedOrg(orgGuid: string): void {
    this.pickedOrgs.update(list => list.filter(o => o.metadata.guid !== orgGuid));
    this.expandedByOrg.update(set => { const next = new Set(set); next.delete(orgGuid); return next; });
  }

  toggleExpanded(orgGuid: string): void {
    this.expandedByOrg.update(set => {
      const next = new Set(set);
      if (next.has(orgGuid)) {
        next.delete(orgGuid);
      } else {
        next.add(orgGuid);
      }
      return next;
    });
  }

  isExpanded(orgGuid: string): boolean {
    return this.expandedByOrg().has(orgGuid);
  }

  // --- Space loading ---

  private loadSpacesFor(orgGuid: string): void {
    if (this.spacesByOrg()[orgGuid]) {
      return; // already loaded
    }
    const spaceSub = this.cfRolesService.fetchSpacesForOrg(this.cfGuid, orgGuid).subscribe(spaces => {
      this.spacesByOrg.update(m => ({ ...m, [orgGuid]: spaces }));
      this.resolveSpacePermissions(orgGuid, spaces);
    });
    this.subs.add(spaceSub);
  }

  /** Resolve SPACE_CHANGE_ROLES per loaded space and write into canChangeSpaceByKey. */
  private resolveSpacePermissions(orgGuid: string, spaces: SpaceEntry[]): void {
    if (!spaces.length) {
      return;
    }
    const obs = spaces.map(space =>
      this.userPerms.can(CfCurrentUserPermissions.SPACE_CHANGE_ROLES, this.cfGuid, orgGuid, space.guid).pipe(
        map(can => ({ key: `${orgGuid}:${space.guid}`, can })),
      ),
    );
    const permSub = combineLatest(obs).subscribe(results => {
      this.canChangeSpaceByKey.update(current => {
        const next = { ...current };
        for (const { key, can } of results) {
          next[key] = can;
        }
        return next;
      });
    });
    this.subs.add(permSub);
  }

  spacesFor(orgGuid: string): SpaceEntry[] {
    return this.spacesByOrg()[orgGuid] ?? [];
  }

  // --- Space filter ---

  setSpaceFilter(orgGuid: string, text: string): void {
    this.spaceFilterByOrg.update(m => ({ ...m, [orgGuid]: text }));
  }

  spaceFilterFor(orgGuid: string): string {
    return this.spaceFilterByOrg()[orgGuid] ?? '';
  }

  filteredSpacesFor(orgGuid: string): SpaceEntry[] {
    const text = this.spaceFilterFor(orgGuid).toLowerCase();
    const spaces = this.spacesFor(orgGuid);
    if (!text) {
      return spaces;
    }
    return spaces.filter(s => s.name.toLowerCase().includes(text));
  }

  // --- Role checked state ---

  checkedForOrg(orgGuid: string, role: OrgUserRoleNames): boolean | null {
    return computeChecked(role, this.users(), this.baseline(), this.selection(), orgGuid);
  }

  checkedForSpace(orgGuid: string, spaceGuid: string, role: SpaceUserRoleNames): boolean | null {
    return computeChecked(role, this.users(), this.baseline(), this.selection(), orgGuid, spaceGuid);
  }

  // --- Org-USER auto-disable rule ---
  // Org USER checkbox is disabled when any other org or space role is set for this org.
  // Ported from CfRoleCheckboxComponent.isDisabled / hasOrgSpaceRole (lines 336-367).
  //
  // Memoized: recomputes when selection, spacesByOrg, users, or baseline changes (all signals).
  // Cost is bounded: the dialog has low CD frequency and Add User operates on 1 user.
  private readonly orgUserDisabledMap = computed<Record<string, boolean>>(() => {
    const sel = this.selection();
    const spacesByOrg = this.spacesByOrg();
    const users = this.users();
    const baseline = this.baseline();
    const result: Record<string, boolean> = {};

    for (const orgGuid of Object.keys(sel).concat(Object.keys(spacesByOrg))) {
      if (orgGuid in result) {
        continue;
      }
      result[orgGuid] = this._computeOrgUserDisabled(orgGuid, sel, spacesByOrg, users, baseline);
    }
    return result;
  });

  private _computeOrgUserDisabled(
    orgGuid: string,
    sel: RoleSelection,
    spacesByOrg: Record<string, SpaceEntry[]>,
    users: StUser[],
    baseline: CfUserRolesSelected,
  ): boolean {
    const selOrg = sel[orgGuid];

    // Check org roles other than USER
    const otherOrgRoles = [OrgUserRoleNames.MANAGER, OrgUserRoleNames.BILLING_MANAGERS, OrgUserRoleNames.AUDITOR];
    for (const role of otherOrgRoles) {
      const checked = computeChecked(role, users, baseline, sel, orgGuid);
      if (checked !== false) {
        return true;
      }
    }

    // Check all space roles across loaded spaces (computeChecked reads baseline + selection)
    const spaces = spacesByOrg[orgGuid] ?? [];
    for (const space of spaces) {
      for (const def of this.spaceRoleDefs) {
        const checked = computeChecked(def.name, users, baseline, sel, orgGuid, space.guid);
        if (checked !== false) {
          return true;
        }
      }
    }

    // Check selection's explicit space-role overrides for spaces not yet loaded
    if (selOrg?.spaces) {
      for (const [, spaceEntry] of Object.entries(selOrg.spaces)) {
        for (const [, val] of Object.entries(spaceEntry.roles)) {
          if (val === true) {
            return true;
          }
        }
      }
    }

    return false;
  }

  isOrgUserDisabled(orgGuid: string): boolean {
    return this.orgUserDisabledMap()[orgGuid] ?? false;
  }

  roleCountForOrg(orgGuid: string): number {
    let n = 0;
    for (const def of this.orgRoleDefs) {
      if (this.checkedForOrg(orgGuid, def.name) === true) { n++; }
    }
    for (const space of this.spacesFor(orgGuid)) {
      for (const def of this.spaceRoleDefs) {
        if (this.checkedForSpace(orgGuid, space.guid, def.name) === true) { n++; }
      }
    }
    return n;
  }

  canEditOrg(orgGuid: string): boolean {
    return this.canEditByOrg()[orgGuid] ?? false;
  }

  /** Returns true if the logged-in user may change roles in the given space.
   * Resolves to true for org managers (ORGANIZATION_CHANGE_ROLES arm) and
   * space managers of that specific space (SPACE_MANAGER arm).
   * Defaults to false until the space-permission observable fires.
   */
  canChangeSpaceRoles(orgGuid: string, spaceGuid: string): boolean {
    return this.canChangeSpaceByKey()[`${orgGuid}:${spaceGuid}`] ?? false;
  }

  // --- Toggle handlers ---

  private ensureOrgInSelection(org: APIResource<IOrganization>): void {
    const orgGuid = org.metadata.guid;
    this.selection.update(sel => {
      if (!sel[orgGuid]) {
        return {
          ...sel,
          [orgGuid]: {
            orgGuid,
            orgName: org.entity.name,
            orgRoles: {},
            spaces: {},
          },
        };
      }
      return sel;
    });
  }

  onToggleOrgRole(org: APIResource<IOrganization>, role: OrgUserRoleNames, value: boolean): void {
    const orgGuid = org.metadata.guid;
    this.ensureOrgInSelection(org);
    this.selection.update(sel => ({
      ...sel,
      [orgGuid]: {
        ...sel[orgGuid],
        orgRoles: {
          ...sel[orgGuid].orgRoles,
          [role]: value,
        },
      },
    }));
    this.changeSet.emit(diffToChanges(this.users(), this.baseline(), this.selection()));
  }

  onToggleSpaceRole(org: APIResource<IOrganization>, space: SpaceEntry, role: SpaceUserRoleNames, value: boolean): void {
    const orgGuid = org.metadata.guid;
    this.ensureOrgInSelection(org);
    this.selection.update(sel => {
      const existingSpaces = sel[orgGuid].spaces;
      return {
        ...sel,
        [orgGuid]: {
          ...sel[orgGuid],
          spaces: {
            ...existingSpaces,
            [space.guid]: {
              spaceName: space.name,
              roles: {
                ...(existingSpaces[space.guid]?.roles ?? {}),
                [role]: value,
              },
            },
          },
        },
      };
    });
    this.changeSet.emit(diffToChanges(this.users(), this.baseline(), this.selection()));
  }
}
