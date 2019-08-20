import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { NgxChartsModule } from '@swimlane/ngx-charts';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../core/src/features/applications/application.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/tab-nav.service';
import { ApplicationServiceMock } from '../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '../../../../core/test-framework/store-test-helper';
import { AppStoreExtensionsModule } from '../../../../store/src/store.extensions.module';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from '../../shared/card-autoscaler-default/card-autoscaler-default.component';
import { AutoscalerTabExtensionComponent } from './autoscaler-tab-extension.component';

describe('AutoscalerTabExtensionComponent', () => {
  let component: AutoscalerTabExtensionComponent;
  let fixture: ComponentFixture<AutoscalerTabExtensionComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        AutoscalerTabExtensionComponent,
        CardAutoscalerDefaultComponent,
      ],
      imports: [
        AppStoreExtensionsModule,
        CfAutoscalerTestingModule,
        BrowserAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        NgxChartsModule,
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
    fixture = TestBed.createComponent(AutoscalerTabExtensionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  afterAll(() => { });
});
