import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { createEmptyStoreModule } from '@stratosui/store/testing';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import {
  RunningInstancesComponent,
} from '../../../../cloud-foundry/src/shared/components/running-instances/running-instances.component';
import { ApplicationStateService } from '../../../../cloud-foundry/src/shared/services/application-state.service';
import { ApplicationServiceMock } from '../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../core/src/core/core.module';
import {
  CopyToClipboardComponent,
} from '../../../../core/src/shared/components/copy-to-clipboard/copy-to-clipboard.component';
import { MetadataItemComponent } from '../../../../core/src/shared/components/metadata-item/metadata-item.component';
import { AppTestModule } from '../../../../core/test-framework/core-test.helper';
import { EntityCatalogHelper } from '../../../../store/src/entity-catalog/entity-catalog-entity/entity-catalog.service';
import { EntityMonitorFactory } from '../../../../store/src/monitors/entity-monitor.factory.service';
import { PaginationMonitorFactory } from '../../../../store/src/monitors/pagination-monitor.factory';
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
        CopyToClipboardComponent,
        RunningInstancesComponent,
      ],
      imports: [
        CfAutoscalerTestingModule,
        CoreModule,
        CommonModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        AppTestModule
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        EntityMonitorFactory,
        PaginationMonitorFactory,
        EntityCatalogHelper
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
