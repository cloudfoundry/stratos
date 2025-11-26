import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  EntityCatalogTestModuleManualStore,
  EntityServiceFactory,
  generateStratosEntities,
  TEST_CATALOGUE_ENTITIES
} from '@stratosui/store';
import { createBasicStoreModule, STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { SidePanelService } from '@stratosui/core';

import { ConnectEndpointComponent } from '../../connect-endpoint/connect-endpoint.component';
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
        EntityServiceFactory,
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
});
