import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateTestApplicationServiceProvider } from '../../../../../../../../test-framework/application-service-helper';
import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../../../../shared/services/application-state.service';
import { ApplicationEnvVarsHelper } from '../../build-tab/application-env-vars.service';
import { RoutesTabComponent } from './routes-tab.component';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoutesTabComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        generateTestApplicationServiceProvider('test', 'test'),
        ApplicationEnvVarsHelper,
        DatePipe,
        ApplicationStateService,
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RoutesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
