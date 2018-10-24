import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationDeleteComponent } from './application-delete.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationsModule } from '../applications.module';
import { generateTestApplicationServiceProvider } from '../../../test-framework/application-service-helper';
import { generateTestEntityServiceProvider } from '../../../test-framework/entity-service.helper';
import { entityFactory, applicationSchemaKey } from '../../../store/helpers/entity-factory';
import { GetApplication } from '../../../store/actions/application.actions';

describe('ApplicationDeleteComponent', () => {
  let component: ApplicationDeleteComponent<any>;
  let fixture: ComponentFixture<ApplicationDeleteComponent<any>>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...BaseTestModules,
        ApplicationsModule
      ],
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ApplicationDeleteComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
