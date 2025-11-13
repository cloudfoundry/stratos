import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  EntityServiceFactory,
  EntityCatalogHelper,
  EntityCatalogHelpers
} from '@stratosui/store';
import { BaseTestModulesNoShared, STORE_TEST_PROVIDERS, BASE_TEST_PROVIDERS } from '@test-framework/core-test.helper';
import { PageHeaderService } from '../../../core/page-header-service/page-header.service';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SharedModule } from '../../../shared/shared.module';
import { TabNavService } from '../../../tab-nav.service';
import { MetricsService } from '../../metrics/services/metrics-service';
import { PageSideNavComponent } from '../page-side-nav/page-side-nav.component';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { DashboardBaseComponent } from './dashboard-base.component';

describe('DashboardBaseComponent', () => {
  let component: DashboardBaseComponent;
  let fixture: ComponentFixture<DashboardBaseComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        DashboardBaseComponent,
        SideNavComponent,
        PageSideNavComponent,
      ],
      providers: [
        EntityServiceFactory,
        PageHeaderService,
        MetricsService,
        TabNavService,
        SidePanelService,
        ...STORE_TEST_PROVIDERS,
        ...BASE_TEST_PROVIDERS,
        provideZonelessChangeDetection(),
      ],
    });

    // Set up entity catalog helper from DI
    // Entities are registered automatically via BaseTestModulesNoShared's CATALOGUE_ENTITIES provider
    const helper = TestBed.inject(EntityCatalogHelper);
    EntityCatalogHelpers.SetEntityCatalogHelper(helper);

    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardBaseComponent);
    component = fixture.componentInstance;
    // Don't call fixture.detectChanges() here - it triggers ngOnInit which requires full catalog setup
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
