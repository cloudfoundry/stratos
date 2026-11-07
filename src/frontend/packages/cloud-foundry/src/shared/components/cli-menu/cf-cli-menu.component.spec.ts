import { provideZonelessChangeDetection, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { TailwindSnackBarService } from '@stratosui/core';

import { ActiveRouteCfOrgSpace } from '../../../features/cf/cf-page.types';
import { CloudFoundryOrganizationService } from '../../../features/cf/services/cloud-foundry-organization.service';
import { CloudFoundrySpaceService } from '../../../features/cf/services/cloud-foundry-space.service';
import { CfCliMenuComponent } from './cf-cli-menu.component';

describe('CfCliMenuComponent (#6126)', () => {
  let fixture: ComponentFixture<CfCliMenuComponent>;
  let orgServiceFactory: ReturnType<typeof vi.fn>;
  let spaceServiceFactory: ReturnType<typeof vi.fn>;

  const el = () => fixture.nativeElement as HTMLElement;
  const labels = () => Array.from(el().querySelectorAll('[role="menuitem"] .cli-menu__label')).map(l => l.textContent?.trim());

  async function render(route: { cfGuid: string, orgGuid?: string, spaceGuid?: string }, tab?: string) {
    orgServiceFactory = vi.fn(() => ({ orgDataService: { org: signal({ name: 'my org' }) } }));
    spaceServiceFactory = vi.fn(() => ({ spaceDataService: { space: signal({ name: 'my space' }) } }));
    TestBed.configureTestingModule({
      imports: [CfCliMenuComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: TailwindSnackBarService, useValue: { show: vi.fn() } },
        { provide: ActiveRouteCfOrgSpace, useValue: route },
        { provide: CloudFoundryOrganizationService, useFactory: orgServiceFactory },
        { provide: CloudFoundrySpaceService, useFactory: spaceServiceFactory },
      ],
    });
    fixture = TestBed.createComponent(CfCliMenuComponent);
    if (tab) {
      fixture.componentRef.setInput('tab', tab);
    }
    await fixture.whenStable();
    (el().querySelector('button[aria-label="CF CLI"]') as HTMLButtonElement).click();
    await fixture.whenStable();
  }

  it('serves a Cloud Foundry without building the organization or space service', async () => {
    await render({ cfGuid: 'cf1' }, 'feature-flags');
    expect(orgServiceFactory).not.toHaveBeenCalled();
    expect(spaceServiceFactory).not.toHaveBeenCalled();
    expect(labels()).toEqual(['cf feature-flags', 'cf feature-flag [name]', 'CF CLI All']);
    expect(el().querySelector('a[role="menuitem"]')?.getAttribute('href')).toBe('/cloud-foundry/cf1/cli');
  });

  it('serves an organization with its name filled in', async () => {
    await render({ cfGuid: 'cf1', orgGuid: 'org1' }, 'spaces');
    expect(spaceServiceFactory).not.toHaveBeenCalled();
    expect(labels()).toEqual(['cf spaces', 'cf create-space [name] -o "my org"', 'CF CLI All']);
    expect(el().querySelector('a[role="menuitem"]')?.getAttribute('href')).toBe('/cloud-foundry/cf1/organizations/org1/cli');
  });

  it('serves a space with both names filled in', async () => {
    await render({ cfGuid: 'cf1', orgGuid: 'org1', spaceGuid: 'space1' }, 'users');
    expect(labels()).toEqual([
      'cf space-users "my org" "my space"',
      'cf set-space-role [user] "my org" "my space" [role]',
      'CF CLI All',
    ]);
    expect(el().querySelector('a[role="menuitem"]')?.getAttribute('href'))
      .toBe('/cloud-foundry/cf1/organizations/org1/spaces/space1/cli');
  });

  it('offers only CF CLI All when no tab is known', async () => {
    await render({ cfGuid: 'cf1' });
    expect(labels()).toEqual(['CF CLI All']);
  });
});
