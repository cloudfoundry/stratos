import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTabComponent } from './routes-tab.component';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { ApplicationEnvVarsHelper } from '../../build-tab/application-env-vars.service';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoutesTabComponent],
      imports: [...BaseTestModules],
      providers: [
        generateTestApplicationServiceProvider('test', 'test'),
        ApplicationEnvVarsHelper
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
