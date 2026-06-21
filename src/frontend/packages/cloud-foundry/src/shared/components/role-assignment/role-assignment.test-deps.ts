/**
 * Shared test harness for RoleAssignmentComponent.
 *
 * Provides the two services the widget injects (CfRolesService and
 * CurrentUserPermissionsService) as lightweight value-fakes, driven by
 * plain data rather than spies so tests stay focused on behaviour.
 *
 * Usage:
 *   TestBed.configureTestingModule({
 *     imports: [RoleAssignmentComponent],
 *     providers: [
 *       provideZonelessChangeDetection(),
 *       ...provideRoleAssignmentTestDeps({
 *         orgs: [{ guid: 'o1', name: 'Org One' }],
 *         spacesByOrg: { o1: [{ guid: 's1', name: 'Space One' }] },
 *       }),
 *     ],
 *   });
 *
 *   const driver = new RoleAssignmentDriver(fixture);
 *   driver.pickOrg('Org One');
 *   driver.toggleOrgRole('o1', 'Manager');
 */

import { Provider } from '@angular/core';
import { ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';

import { CfRolesService } from '../../../features/cf/users/manage-users/cf-roles.service';
import { CurrentUserPermissionsService } from '../../../../../core/src/core/permissions/current-user-permissions.service';

// ── Configuration ─────────────────────────────────────────────────────────────

export interface RoleAssignmentTestCfg {
  /** Orgs returned by fetchOrgs (as minimal APIResource<IOrganization> shapes). */
  orgs: { guid: string; name: string }[];
  /** Spaces per org returned by fetchSpacesForOrg. */
  spacesByOrg: Record<string, { guid: string; name: string }[]>;
  /**
   * Optional permission predicate.  Receives the same args as
   * CurrentUserPermissionsService.can().  Defaults to `() => true`.
   */
  permissions?: (perm: unknown, cf: string, org?: string, space?: string) => boolean;
}

// ── Provider factory ──────────────────────────────────────────────────────────

export function provideRoleAssignmentTestDeps(cfg: RoleAssignmentTestCfg): Provider[] {
  const orgsAsResources = cfg.orgs.map(o => ({
    metadata: { guid: o.guid, created_at: '', updated_at: '', url: '' },
    entity: { name: o.name },
  }));

  return [
    {
      provide: CfRolesService,
      useValue: {
        fetchOrgs: () => of(orgsAsResources),
        fetchSpacesForOrg: (_cf: string, orgGuid: string) =>
          of(cfg.spacesByOrg[orgGuid] ?? []),
      },
    },
    {
      provide: CurrentUserPermissionsService,
      useValue: {
        can: (perm: unknown, cf: string, org?: string, space?: string) =>
          of(cfg.permissions ? cfg.permissions(perm, cf, org, space) : true),
      },
    },
  ];
}

// ── Driver ────────────────────────────────────────────────────────────────────

/**
 * DOM driver for RoleAssignmentComponent.  Targets the data-testid attributes
 * and role-definition labels established in role-assignment.component.html.
 */
export class RoleAssignmentDriver {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(private fixture: ComponentFixture<any>) {}

  private get el(): HTMLElement {
    return this.fixture.nativeElement as HTMLElement;
  }

  // ── Org picker ─────────────────────────────────────────────────────────────

  /** Click the org-picker button whose text matches `name`. */
  pickOrg(name: string): void {
    const picker = this.el.querySelector('[data-testid="org-picker"]');
    if (!picker) {
      throw new Error('RoleAssignmentDriver.pickOrg: org-picker not found (lockedOrg may be set)');
    }
    const btns = Array.from(picker.querySelectorAll('.role-assignment__org-btn'));
    const btn = btns.find(b => b.textContent?.trim() === name) as HTMLButtonElement | undefined;
    if (!btn) {
      throw new Error(`RoleAssignmentDriver.pickOrg: no button found for org name "${name}"`);
    }
    btn.click();
    this.fixture.detectChanges();
  }

  // ── Role toggles ───────────────────────────────────────────────────────────

  /**
   * Toggle the org-level role cell with the given label inside the org section
   * identified by `orgGuid`.
   *
   * Finds the `[data-org]` section, then within it locates the `org-role-cell`
   * whose `app-role-tristate-checkbox` carries the matching label text, then
   * calls `toggle()` on the underlying `app-checkbox` element.
   */
  toggleOrgRole(orgGuid: string, label: string): void {
    const section = this.orgSection(orgGuid);
    const cells = Array.from(section.querySelectorAll('[data-testid="org-role-cell"]'));
    this.toggleRoleInCells(cells, label, `toggleOrgRole(${orgGuid}, ${label})`);
  }

  /**
   * Toggle the space-level role cell with the given label inside the org section
   * for `orgGuid`, scoped to the exact space section identified by `spaceGuid`.
   *
   * Requires the template to emit `[attr.data-space]="space.guid"` on each
   * `.role-assignment__space-section` div (added alongside the existing
   * `[attr.data-org]` on org sections).  Throws a loud diagnostic error if the
   * space section is not found, consistent with the fail-loud contract of
   * {@link toggleOrgRole}.
   */
  toggleSpaceRole(orgGuid: string, spaceGuid: string, label: string): void {
    const orgSec = this.orgSection(orgGuid);
    const spaceSec = orgSec.querySelector(`[data-space="${spaceGuid}"]`);
    if (!spaceSec) {
      const found = Array.from(orgSec.querySelectorAll('.role-assignment__space-section'))
        .map(s => s.getAttribute('data-space'))
        .join(', ');
      throw new Error(
        `RoleAssignmentDriver.toggleSpaceRole: space section [data-space="${spaceGuid}"] ` +
        `not found inside org [data-org="${orgGuid}"]. Found data-space values: [${found}]`
      );
    }
    const cells = Array.from(spaceSec.querySelectorAll('[data-testid="space-role-cell"]'));
    this.toggleRoleInCells(cells, label, `toggleSpaceRole(${orgGuid}, ${spaceGuid}, ${label})`);
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private orgSection(orgGuid: string): Element {
    const section = this.el.querySelector(`[data-org="${orgGuid}"]`);
    if (!section) {
      throw new Error(`RoleAssignmentDriver: org section [data-org="${orgGuid}"] not found`);
    }
    return section;
  }

  /**
   * Try to toggle a role cell matching `label` within `cells`.
   * Returns true if found and toggled, false otherwise.
   */
  private tryToggleRoleInCells(cells: Element[], label: string): boolean {
    for (const cell of cells) {
      // The cell contains an app-role-tristate-checkbox which renders app-checkbox.
      // The label text is the label input to the tristate checkbox, displayed as
      // the text content of app-checkbox (projected ng-content).
      // We match by trimmed text content of the outermost cell.
      const tristateEl = cell.querySelector('app-role-tristate-checkbox');
      if (!tristateEl) {
        continue;
      }
      const text = tristateEl.textContent?.trim() ?? '';
      if (text === label) {
        const checkboxEl = tristateEl.querySelector('app-checkbox, mat-checkbox');
        if (!checkboxEl) {
          continue;
        }
        // CustomCheckboxComponent.toggle() is wired to (click) on .custom-checkbox div.
        // Use the debugElement of the fixture to get the component instance and call toggle().
        const checkboxDiv = checkboxEl.querySelector('.custom-checkbox') as HTMLElement;
        if (checkboxDiv) {
          checkboxDiv.click();
        } else {
          // Direct approach: find component via debugElement
          this.toggleViaDebugElement(cell, label);
        }
        return true;
      }
    }
    return false;
  }

  private toggleRoleInCells(cells: Element[], label: string, context: string): void {
    const found = this.tryToggleRoleInCells(cells, label);
    if (!found) {
      throw new Error(
        `RoleAssignmentDriver.${context}: no role cell found with label "${label}". ` +
        `Available: ${cells.map(c => c.querySelector('app-role-tristate-checkbox')?.textContent?.trim()).join(', ')}`
      );
    }
    this.fixture.detectChanges();
  }

  /**
   * Fallback: find the app-checkbox DebugElement within the cell whose label
   * matches and call toggle() on its component instance.
   */
  private toggleViaDebugElement(cell: Element, label: string): void {
    // Walk fixture debugElement to find a matching checkbox within this cell
    const allCheckboxes = this.fixture.debugElement.queryAll(By.css('app-checkbox, mat-checkbox'));
    for (const dbEl of allCheckboxes) {
      if (!cell.contains(dbEl.nativeElement)) {
        continue;
      }
      const text = (dbEl.nativeElement as Element).textContent?.trim() ?? '';
      if (text === label && dbEl.componentInstance?.toggle) {
        dbEl.componentInstance.toggle();
        return;
      }
    }
  }
}
