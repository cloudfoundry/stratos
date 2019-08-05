import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../core/src/core/core.module';
import { ApplicationService } from '../../../../core/src/features/applications/application.service';
import { ApplicationStateService } from '../../../../core/src/shared/components/application-state/application-state.service';
import { MetadataItemComponent } from '../../../../core/src/shared/components/metadata-item/metadata-item.component';
import {
  RunningInstancesComponent,
} from '../../../../core/src/shared/components/running-instances/running-instances.component';
import { EntityMonitorFactory } from '../../../../core/src/shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../core/src/shared/monitors/pagination-monitor.factory';
import { ApplicationServiceMock } from '../../../../core/test-framework/application-service-helper';
import { createEmptyStoreModule } from '../../../../core/test-framework/store-test-helper';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';

describe('CardAutoscalerDefaultComponent', () => {
  let component: CardAutoscalerDefaultComponent;
  let fixture: ComponentFixture<CardAutoscalerDefaultComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAutoscalerDefaultComponent,
        MetadataItemComponent,
        RunningInstancesComponent,
      ],
      imports: [
        CfAutoscalerTestingModule,
        CoreModule,
        CommonModule,
        BrowserAnimationsModule,
        createEmptyStoreModule(),
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        EntityMonitorFactory,
        PaginationMonitorFactory,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAutoscalerDefaultComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
