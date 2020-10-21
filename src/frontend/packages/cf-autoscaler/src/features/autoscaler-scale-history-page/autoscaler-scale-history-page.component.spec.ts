import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { createEmptyStoreModule } from '@stratosui/store/testing';

import { ApplicationService } from '../../../../cloud-foundry/src/shared/services/application.service';
import { ApplicationServiceMock } from '../../../../cloud-foundry/test-framework/application-service-helper';
import { CoreModule } from '../../../../core/src/core/core.module';
import { CurrentUserPermissionsService } from '../../../../core/src/core/permissions/current-user-permissions.service';
import { SharedModule } from '../../../../core/src/shared/shared.module';
import { TabNavService } from '../../../../core/src/tab-nav.service';
import { CfAutoscalerTestingModule } from '../../cf-autoscaler-testing.module';
import { AutoscalerScaleHistoryPageComponent } from './autoscaler-scale-history-page.component';

describe('AutoscalerScaleHistoryPageComponent', () => {
  let component: AutoscalerScaleHistoryPageComponent;
  let fixture: ComponentFixture<AutoscalerScaleHistoryPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AutoscalerScaleHistoryPageComponent],
      imports: [
        CfAutoscalerTestingModule,
        NoopAnimationsModule,
        createEmptyStoreModule(),
        CoreModule,
        SharedModule,
        RouterTestingModule,
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
    fixture = TestBed.createComponent(AutoscalerScaleHistoryPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });


});
