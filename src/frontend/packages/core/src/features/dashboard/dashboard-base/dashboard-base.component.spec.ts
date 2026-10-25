import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EntityCatalogHelper, EntityCatalogHelpers } from '@stratosui/store';
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

  describe('side panel', () => {
    const panel = (): HTMLElement => fixture.nativeElement.querySelector('.dashboard-side-help-outer');

    beforeEach(async () => {
      fixture.detectChanges();
      await fixture.whenStable();
    });

    // The closed panel sits off screen but was a role="button" tabindex="0"
    // div, so Tab landed in it and its whole text became one button name.
    it('is a labelled panel, not a button', () => {
      expect(panel().getAttribute('role')).not.toBe('button');
      expect(panel().hasAttribute('tabindex')).toBe(false);
      expect(panel().tagName).toBe('ASIDE');
      expect(panel().getAttribute('aria-label')).toBeTruthy();
    });

    it('is out of the tab order and accessibility tree while closed', () => {
      expect(panel().hasAttribute('inert')).toBe(true);
    });

    it('is reachable while open', async () => {
      TestBed.inject(SidePanelService).open();
      await fixture.whenStable();
      expect(panel().hasAttribute('inert')).toBe(false);
    });
  });
});
