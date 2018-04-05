import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { PageHeaderService } from '../../../core/page-header-service/page-header.service';
import { SharedModule } from '../../../shared/shared.module';
import { appReducers } from '../../../store/reducers.module';
import { SideNavComponent } from '../side-nav/side-nav.component';
import { DashboardBaseComponent } from './dashboard-base.component';
import { MetricsService } from '../../metrics/services/metrics-service';

describe('DashboardBaseComponent', () => {
  let component: DashboardBaseComponent;
  let fixture: ComponentFixture<DashboardBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardBaseComponent, SideNavComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        )
      ],
      providers: [
        PageHeaderService,
        MetricsService,
      ]
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
