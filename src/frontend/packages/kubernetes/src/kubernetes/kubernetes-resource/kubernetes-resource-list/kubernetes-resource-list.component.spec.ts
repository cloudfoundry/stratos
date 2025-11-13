import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { ActivatedRoute, Router } from '@angular/router';

import { TabNavService } from '@stratosui/core';
import { STORE_TEST_PROVIDERS, createBasicStoreModule } from '@stratosui/store/testing';
import {
  entityCatalog,
  TestEntityCatalog,
  generateStratosEntities,
  EntityCatalogProvidersModule,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { kubeEntityCatalog } from '../../kubernetes-entity-generator';
import { BaseKubeGuid } from '../../kubernetes-page.types';
import { KubernetesResourceListComponent } from './kubernetes-resource-list.component';

describe('KubernetesResourceListComponent', () => {
  let component: KubernetesResourceListComponent;
  let fixture: ComponentFixture<KubernetesResourceListComponent>;

  beforeEach(async () => {
    // Manually register catalog entities before TestBed setup
    const testEntityCatalog = entityCatalog as TestEntityCatalog;
    testEntityCatalog.clear();
    const entities = [
      ...generateStratosEntities(),
      ...kubeEntityCatalog.allKubeEntities(),
    ];
    entities.forEach(entity => entityCatalog.register(entity));

    await TestBed.configureTestingModule({
      imports: [
        createBasicStoreModule(),
        EntityCatalogProvidersModule,
        KubernetesResourceListComponent
      ],
      providers: [
        ...STORE_TEST_PROVIDERS,
        {
          provide: BaseKubeGuid,
          useValue: { guid: 'test-guid' }
        },
        TabNavService,
        {
          provide: Router,
          useValue: {
            url: '/kubernetes/test-guid/pods'
          }
        },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              data: {
                entityCatalogKey: 'pod'
              },
              params: {
              },
              queryParams: {}
            }
          }
        },
        provideZonelessChangeDetection(),
        provideNoopAnimations(),
      ]
    }).compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(KubernetesResourceListComponent);
    component = fixture.componentInstance;
    // Don't call detectChanges to avoid triggering subscriptions
    // and async operations that aren't needed for basic component tests
    // fixture.detectChanges();
  });

  afterEach(() => {
    // Destroy fixture to clean up DOM and subscriptions
    if (fixture) {
      fixture.destroy();
    }
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
