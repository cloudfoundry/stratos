import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CardAppInstancesComponent } from './card-app-instances.component';
import { CardStatusComponent } from '../../../card-status/card-status.component';
import { ApplicationStateComponent } from '../../../application-state/application-state.component';
import { ApplicationStateIconComponent } from '../../../application-state/application-state-icon/application-state-icon.component';
import { ApplicationStateIconPipe } from '../../../application-state/application-state-icon/application-state-icon.pipe';
import { CoreModule } from '../../../../../core/core.module';
import { ApplicationService } from '../../../../../features/applications/application.service';
import { ApplicationServiceMock } from '../../../../../test-framework/application-service-helper';
import { createBasicStoreModule } from '../../../../../test-framework/store-test-helper';
import { ApplicationStateService } from '../../../application-state/application-state.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CommonModule } from '@angular/common';
import { ConfirmationDialogService } from '../../../confirmation-dialog.service';

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
