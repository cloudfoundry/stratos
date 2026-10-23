import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { ConnectEndpointComponent } from './connect-endpoint.component';
import { ConnectEndpointService } from '../connect.service';

describe('ConnectEndpointComponent', () => {
  let component: ConnectEndpointComponent;
  let fixture: ComponentFixture<ConnectEndpointComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        ConnectEndpointComponent,
      ],
      providers: [
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });

    // Set up entity catalog helper from DI
    // Entities are registered automatically via BaseTestModules' CATALOGUE_ENTITIES provider
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    TestBed.compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(ConnectEndpointComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('offers a username and password or no login for Metrics', async () => {
    component.connectService = {
      config: { name: 'metrics', guid: 'metrics-guid', type: 'metrics', subType: '', ssoAllowed: false },
      setData: () => undefined,
    } as unknown as ConnectEndpointService;
    await fixture.whenStable();
    expect(component.authTypesForEndpoint.map(a => a.value)).toEqual(['creds', 'none']);
  });
});
