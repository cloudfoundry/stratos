import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { CoreModule } from '../../../../../core/src/core/core.module';
import { generateCfStoreModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../shared/services/application-state.service';
import { ApplicationBaseComponent } from './application-base.component';
import { ApplicationEnvVarsHelper } from './application-tabs-base/tabs/build-tab/application-env-vars.service';

describe('ApplicationBaseComponent', () => {
  let component: ApplicationBaseComponent;
  let fixture: ComponentFixture<ApplicationBaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ApplicationBaseComponent],
      imports: [
        CoreModule,
        RouterTestingModule,
        generateCfStoreModules()
      ],
      providers: [
        ApplicationStateService,
        ApplicationEnvVarsHelper
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationBaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
