import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import {
  entityCatalog,
  EntityServiceFactory,
  generateStratosEntities,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { BaseTestModules, STORE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { ConnectEndpointComponent } from './connect-endpoint.component';

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
        EntityServiceFactory,
        ...(STORE_TEST_PROVIDERS || []),
        provideZonelessChangeDetection(),
      ]
    });

    // Clear and register entities on the singleton entity catalog
    (entityCatalog as any).clear();
    const entities = generateStratosEntities();
    entities.forEach(entity => entityCatalog.register(entity));

    // Set up entity catalog helper from DI
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ConnectEndpointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
