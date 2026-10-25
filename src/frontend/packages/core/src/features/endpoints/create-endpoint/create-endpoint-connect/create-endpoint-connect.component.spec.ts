import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EntityCatalogTestModuleManualStore,
  generateStratosEntities,
  StratosCatalogEndpointEntity,
  TEST_CATALOGUE_ENTITIES,
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { SidePanelService } from '@stratosui/core';

import { BaseEndpointAuth } from '../../../../core/endpoint-auth';
import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointService } from '../../connect.service';
import { CreateEndpointConnectComponent } from './create-endpoint-connect.component';

// Connects with one token, as GitHub does
const tokenEndpoint = new StratosCatalogEndpointEntity({
  type: 'token-endpoint',
  label: 'Token Endpoint',
  labelPlural: 'Token Endpoints',
  logoUrl: '',
  authTypes: [{
    ...BaseEndpointAuth.Token,
    help: '/core/assets/connect/github.md',
    config: { title: 'Personal Access Token' },
  }],
  renderPriority: 1,
});

describe('CreateEndpointConnectComponent', () => {
  let component: CreateEndpointConnectComponent;
  let fixture: ComponentFixture<CreateEndpointConnectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogTestModuleManualStore,
        CreateEndpointConnectComponent,
        ConnectEndpointComponent,
      ],
      providers: [
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [...generateStratosEntities(), tokenEndpoint]
        },
        SidePanelService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ]
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateEndpointConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  // Previous back to the register step and Next again enters this step again
  it('ends the previous connect when the step is entered again', () => {
    const destroy = vi.spyOn(ConnectEndpointService.prototype, 'destroy');
    const config = { name: 'ep', guid: 'ep-1', type: 'cf', subType: null, ssoAllowed: false };
    component.onEnter(config as any);
    component.onEnter(config as any);

    expect(destroy).toHaveBeenCalledTimes(1);
    destroy.mockRestore();
  });

  // The credentials and endpoint options belong to "Connect now": shown
  // only while it is ticked, so the step never shows an unticked box with a
  // credentials form under it.
  it('shows the credentials only while Connect now is ticked', async () => {
    const config = { name: 'ep', guid: 'ep-1', type: 'cf', subType: null, ssoAllowed: false };
    component.onEnter(config as any);
    await fixture.whenStable();
    const form = () => fixture.nativeElement.querySelector('app-connect-endpoint');
    const box = () => fixture.nativeElement.querySelector('app-checkbox .custom-checkbox') as HTMLElement;
    expect(form()).toBeNull();

    box().click();
    await fixture.whenStable();
    expect(component.doConnect).toBe(true);
    expect(form()).not.toBeNull();

    box().click();
    await fixture.whenStable();
    expect(component.doConnect).toBe(false);
    expect(form()).toBeNull();
  });

  // Each registration starts the step fresh: a choice made for an earlier
  // endpoint does not carry over.
  it('starts unticked each time it is entered', async () => {
    const config = { name: 'ep', guid: 'ep-1', type: 'cf', subType: null, ssoAllowed: false };
    component.onEnter(config as any);
    component.doConnect = true;
    component.valid = true;

    component.onEnter({ ...config, guid: 'ep-2' } as any);
    await fixture.whenStable();
    expect(component.doConnect).toBe(false);
    expect(component.valid).toBe(false);
    expect(fixture.nativeElement.querySelector('app-checkbox .custom-checkbox')?.getAttribute('aria-checked')).toBe('false');
  });

  describe('credentials title', () => {
    const connectNow = async (type: string) => {
      component.onEnter({ name: 'ep', guid: 'ep-1', type, subType: null, ssoAllowed: false } as any);
      await fixture.whenStable();
      (fixture.nativeElement.querySelector('app-checkbox .custom-checkbox') as HTMLElement).click();
      await fixture.whenStable();
      return fixture.nativeElement.querySelector('.connect__title') as HTMLElement;
    };

    // One token to enter: the title says which, not "Connection Credentials"
    it('names what to enter for an auth type that titles its field', async () => {
      const title = await connectNow('token-endpoint');
      expect(title.querySelector('.connect__title-inner')?.textContent?.trim()).toBe('Personal Access Token');
      // Named in the same render, as is its help document
      expect(title.querySelector('button.connect__title-help')).not.toBeNull();
    });

    // The help button sat on the title's last letter
    it('keeps the help button clear of the title', async () => {
      const title = await connectNow('token-endpoint');
      expect(title.classList).toContain('gap-2');
      expect(title.querySelector('.connect__title-inner')?.classList).toContain('min-w-0');
      expect(title.querySelector('button.connect__title-help')?.classList).toContain('shrink-0');
    });

    // An icon-only button: its name is all a screen reader has
    it('names the help button', async () => {
      const title = await connectNow('token-endpoint');
      expect(title.querySelector('button.connect__title-help')?.getAttribute('aria-label')).toBe('Help on connecting');
    });

    it('reads Connection Credentials for other auth types', async () => {
      const title = await connectNow('metrics');
      expect(title.querySelector('.connect__title-inner')?.textContent?.trim()).toBe('Connection Credentials');
    });
  });
});
