import { ComponentFixture, TestBed } from '@angular/core/testing';
import { importProvidersFrom, provideZonelessChangeDetection, signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { of } from 'rxjs';

import { ApplicationStateIconComponent } from '@stratosui/core';
import { EntityCatalogTestModule, generateStratosEntities, TEST_CATALOGUE_ENTITIES, EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
import { StratosStatus } from '@stratosui/store';
import { STORE_TEST_PROVIDERS } from '@stratosui/store/testing';
import { CloudFoundryTestingModule, generateCFEntities } from '@test-framework/cf';
import { AppStatsDataRegistry } from '../../../../services/endpoint-data/app-stats-data.registry';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ActiveRouteCfOrgSpace } from '../../../cf/cf-page.types';
import { CompactAppCardComponent } from './compact-app-card.component';
describe('CompactAppCardComponent', () => {
  let component: CompactAppCardComponent;
  let fixture: ComponentFixture<CompactAppCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        CompactAppCardComponent,
        ApplicationStateIconComponent,
      ],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideNoopAnimations(),
        ...STORE_TEST_PROVIDERS,
        ApplicationStateService,
        importProvidersFrom(
          CloudFoundryTestingModule,
          EntityCatalogTestModule
        ),
        {
          provide: TEST_CATALOGUE_ENTITIES,
          useValue: [
            ...generateStratosEntities(),
            ...generateCFEntities(),
          ]
        },
        EntityCatalogHelper,
      ]
    })
      .compileComponents();

    // Initialize EntityCatalogHelper for Angular 20 compatibility
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactAppCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('app', {
      entity: {},
      metadata: {}
    });
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

describe('CompactAppCardComponent status (#6021)', () => {
  const app = (state: string) => ({
    metadata: { guid: 'app-1', updated_at: '2026-01-01T00:00:00Z' },
    entity: { name: 'one', state, instances: 1, package_state: 'STAGED' },
  });

  let fixture: ComponentFixture<CompactAppCardComponent>;
  let stats: {
    stats: ReturnType<typeof signal<{ state: string }[]>>;
    lastFetched: ReturnType<typeof signal<Date | null>>;
    load: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    stats = {
      stats: signal([{ state: 'RUNNING' }]),
      lastFetched: signal<Date | null>(new Date()),
      load: vi.fn(() => of(undefined)),
    };
    TestBed.configureTestingModule({
      imports: [CompactAppCardComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        { provide: ActiveRouteCfOrgSpace, useValue: null },
        { provide: AppStatsDataRegistry, useValue: { acquire: () => stats } },
      ],
    });
    fixture = TestBed.createComponent(CompactAppCardComponent);
    fixture.componentRef.setInput('endpoint', 'ep-1');
  });

  it('follows a new app input when the stats do not change', async () => {
    fixture.componentRef.setInput('app', app('STARTED'));
    await fixture.whenStable();
    expect(fixture.componentInstance.appStatus()).toBe(StratosStatus.OK);

    // A list refresh after a stop hands the card a new app object; the
    // cached stats stay as they were.
    fixture.componentRef.setInput('app', app('STOPPED'));
    await fixture.whenStable();
    expect(fixture.componentInstance.appStatus()).toBe(StratosStatus.WARNING);
  });

  it('shows a tentative status, not a busy one, before the stats arrive', async () => {
    stats.stats.set([]);
    stats.lastFetched.set(null);
    fixture.componentRef.setInput('app', app('STARTED'));
    await fixture.whenStable();
    expect(fixture.componentInstance.appStatus()).toBe(StratosStatus.TENTATIVE);
  });
});
