import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityCatalogTestModuleManualStore, generateStratosEntities, TEST_CATALOGUE_ENTITIES } from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { SidePanelService } from '@stratosui/core';

import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
import { ConnectEndpointService } from '../../connect.service';
import { CreateEndpointConnectComponent } from './create-endpoint-connect.component';

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
          useValue: generateStratosEntities()
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
});
