import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule, HttpHandler } from '@angular/common/http';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '@stratosui/store';
import { TabNavService } from '../../../../tab-nav.service';
import { CoreModule } from '../../../core/core.module';
import { PageHeaderService } from '../../../core/page-header-service/page-header.service';
import { SidePanelService } from '../../../shared/services/side-panel.service';
import { SharedModule } from '../../../shared/shared.module';
import { MetricsService } from '../../metrics/services/metrics-service';
import { PageSideNavComponent } from '../page-side-nav/page-side-nav.component';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { DashboardBaseComponent } from './dashboard-base.component';

describe('DashboardBaseComponent', () => {
  let component: DashboardBaseComponent;
  let fixture: ComponentFixture<DashboardBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardBaseComponent, SideNavComponent, PageSideNavComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers
        ),
        HttpClientModule,
        HttpClientTestingModule
      ],
      providers: [
        PageHeaderService,
        MetricsService,
        TabNavService,
        HttpClient,
        HttpHandler,
        SidePanelService
      ],
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
