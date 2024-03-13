import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';

import { ApplicationService } from '../../../../cloud-foundry/src/features/applications/application.service';
import { ApplicationServiceMock } from '../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../core/src/core/core.module';
import { CurrentUserPermissionsService } from '../../../../core/src/core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/src/tab-nav.service';
import { createBasicStoreModule } from '../../../../store/testing/public-api';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { EditAutoscalerCredentialComponent } from './edit-autoscaler-credential.component';

describe('EditAutoscalerCredentialComponent', () => {
  let component: EditAutoscalerCredentialComponent;
  let fixture: ComponentFixture<EditAutoscalerCredentialComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [
        EditAutoscalerCredentialComponent,
      ],
      imports: [
        BrowserAnimationsModule,
        createBasicStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
        CfAutoscalerTestingModule
      ],
      providers: [
        DatePipe,
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        TabNavService,
        CurrentUserPermissionsService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditAutoscalerCredentialComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
