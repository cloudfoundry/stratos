import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { describe, it, expect, beforeEach } from 'vitest';
import { entityCatalog } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { TabNavService, CurrentUserPermissionsService, SidePanelService } from '@stratosui/core';
import { AppTestModule } from '@test-framework/core-test.helper';

import { generateCoreStratosEntities } from '../../metrics/metrics-endpoint';
import { ConnectEndpointComponent } from '../connect-endpoint/connect-endpoint.component';
import { CreateEndpointCfStep1Component } from './create-endpoint-cf-step-1/create-endpoint-cf-step-1.component';
import { CreateEndpointConnectComponent } from './create-endpoint-connect/create-endpoint-connect.component';
import { CreateEndpointComponent } from './create-endpoint.component';

describe('CreateEndpointComponent', () => {
  let component: CreateEndpointComponent;
  let fixture: ComponentFixture<CreateEndpointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        AppTestModule,
        CreateEndpointComponent,
        CreateEndpointCfStep1Component,
        CreateEndpointConnectComponent,
        ConnectEndpointComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParams: {},
              params: {
                type: 'metrics',
                subtype: null,
              }
            }
          },
        },
        CurrentUserPermissionsService,
        TabNavService,
        SidePanelService,
        ...STORE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    }).compileComponents();

    // Register entities AFTER modules are loaded, as the app does: the
    // core-completed set, so Metrics carries its auth types.
    const entities = generateCoreStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(CreateEndpointComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // Metrics accepts a username/password or no login (jetstream metrics
  // plugin Connect), so registering it offers the same optional Connect
  // step as Cloud Foundry.
  it('offers the optional Connect step when registering Metrics', () => {
    expect(component.showConnectStep).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Connect (Optional)');
  });
});
