import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import {
  ApplicationStateIconComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import {
  ApplicationStateComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state.component';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import { PaginationMonitorFactory } from '../../../../../../store/src/monitors/pagination-monitor.factory';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationService } from '../../../../features/applications/application.service';
import { ApplicationStateService } from '../../../services/application-state.service';
import { RunningInstancesComponent } from '../../running-instances/running-instances.component';
import { CardAppInstancesComponent } from './card-app-instances.component';

describe('CardAppInstancesComponent', () => {
  let component: CardAppInstancesComponent;
  let fixture: ComponentFixture<CardAppInstancesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        CardAppInstancesComponent,
        CardStatusComponent,
        ApplicationStateComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe,
        RunningInstancesComponent,
      ],
      imports: [
        CoreModule,
        CommonModule,
        NoopAnimationsModule,
        generateCfStoreModules()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ConfirmationDialogService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
