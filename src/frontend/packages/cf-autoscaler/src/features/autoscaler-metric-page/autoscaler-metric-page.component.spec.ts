import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '../../../../core/test-framework/store-test-helper';
import { AppStoreExtensionsModule } from '../../../../store/src/store.extensions.module';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { AutoscalerMetricPageComponent } from './autoscaler-metric-page.component';

describe('AutoscalerMetricPageComponent', () => {
  let component: AutoscalerMetricPageComponent;
  let fixture: ComponentFixture<AutoscalerMetricPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoscalerMetricPageComponent],
      imports: [
        CfAutoscalerTestingModule,
        AppStoreExtensionsModule,
        BrowserAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AutoscalerMetricPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  // TODO: Fix after metrics has been sorted (cause of `Cannot read property 'getEntityMonitor' of undefined` test failure)
  it('Blocked', () => {
    fail('Blocked: Requires metrics to be working (specifically metrics entities)');
  });

  afterAll(() => { });
});
