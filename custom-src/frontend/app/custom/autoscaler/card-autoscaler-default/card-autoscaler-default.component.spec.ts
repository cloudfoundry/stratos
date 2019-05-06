import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAutoscalerDefaultComponent } from './card-autoscaler-default.component';
import { CoreModule } from '../../../core/core.module';
import { ApplicationService } from '../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../..//test-framework/store-test-helper';
import { ApplicationStateService } from '../../../../../core/src/shared/components/application-state/application-state.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { MetadataItemComponent } from '../../../shared/components/metadata-item/metadata-item.component';
import { RunningInstancesComponent } from '../../../shared/components/running-instances/running-instances.component';
import { EntityMonitorFactory } from '../../../shared/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';

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
        CoreModule,
        CommonModule,
        BrowserAnimationsModule,
        createBasicStoreModule()
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
