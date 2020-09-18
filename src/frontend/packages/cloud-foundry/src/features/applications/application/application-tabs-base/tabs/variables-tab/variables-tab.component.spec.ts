import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import { MDAppModule } from '../../../../../../../../core/src/core/md.module';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { ApplicationServiceMock } from '../../../../../../../test-framework/application-service-helper';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../../../shared/services/application-state.service';
import { ApplicationService } from '../../../../application.service';
import { ApplicationEnvVarsHelper } from '../build-tab/application-env-vars.service';
import { VariablesTabComponent } from './variables-tab.component';

describe('VariablesTabComponent', () => {
  let component: VariablesTabComponent;
  let fixture: ComponentFixture<VariablesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [VariablesTabComponent],
      imports: [
        StoreModule,
        CoreModule,
        SharedModule,
        MDAppModule,
        NoopAnimationsModule,
        generateCfStoreModules()
      ],
      providers: [
        { provide: ApplicationService, useClass: ApplicationServiceMock },
        ApplicationStateService,
        ApplicationEnvVarsHelper,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(VariablesTabComponent);
    component = fixture.componentInstance;

    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
