import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from "../../test-framework/cf-autoscaler-test.helper";
import { BaseChartDirective } from 'ng2-charts';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import {
  CardAppInstancesComponent,
} from '../../../../cloud-foundry/src/shared/components/cards/card-app-instances/card-app-instances.component';
import {
  CardAppUsageComponent,
} from '../../../../cloud-foundry/src/shared/components/cards/card-app-usage/card-app-usage.component';
import {
  RunningInstancesComponent,
} from '../../../../cloud-foundry/src/shared/components/running-instances/running-instances.component';
import {
  cfCurrentUserPermissionsService,
} from '../../../../cloud-foundry/src/user-permissions/cf-user-permissions-checkers';
import { ApplicationServiceMock } from '../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../core/src/core/core.module';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/src/tab-nav.service';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from '../../shared/card-autoscaler-default/card-autoscaler-default.component';
import { AutoscalerTabExtensionComponent } from './autoscaler-tab-extension.component';

describe('AutoscalerTabExtensionComponent', () => {
  let component: AutoscalerTabExtensionComponent;
  let fixture: ComponentFixture<AutoscalerTabExtensionComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        AutoscalerTabExtensionComponent,
        CardAutoscalerDefaultComponent,
        CardAppInstancesComponent,
        CardAppUsageComponent,
        RunningInstancesComponent
      ],
      imports: [
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        BaseChartDirective,
        RouterTestingModule,
      ],
      providers: [
        
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        ...cfCurrentUserPermissionsService
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

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
