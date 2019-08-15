import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

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
import {
  ApplicationStateService,
} from '../../../../../../core/src/shared/components/application-state/application-state.service';
import { CardStatusComponent } from '../../../../../../core/src/shared/components/cards/card-status/card-status.component';
import { ConfirmationDialogService } from '../../../../../../core/src/shared/components/confirmation-dialog.service';
import {
  RunningInstancesComponent,
} from '../../../../../../core/src/shared/components/running-instances/running-instances.component';
import { PaginationMonitorFactory } from '../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { ApplicationServiceMock } from '../../../../../../core/test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../../core/test-framework/store-test-helper';
import { ApplicationService } from '../../../../features/applications/application.service';
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
        BrowserAnimationsModule,
        createBasicStoreModule()
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
