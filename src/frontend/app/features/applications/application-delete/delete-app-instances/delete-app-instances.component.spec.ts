import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DeleteAppServiceInstancesComponent } from './delete-app-instances.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestEntityServiceProvider } from '../../../../test-framework/entity-service.helper';
import { entityFactory, applicationSchemaKey } from '../../../../store/helpers/entity-factory';
import { GetApplication } from '../../../../store/actions/application.actions';
import { generateTestApplicationServiceProvider } from '../../../../test-framework/application-service-helper';
import { ApplicationEnvVarsService } from '../../application/application-tabs-base/tabs/build-tab/application-env-vars.service';
import { DatePipe } from '@angular/common';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import {
  TableHeaderSelectComponent
} from '../../../../shared/components/list/list-table/table-header-select/table-header-select.component';

describe('DeleteAppInstancesComponent', () => {
  let component: DeleteAppServiceInstancesComponent;
  let fixture: ComponentFixture<DeleteAppServiceInstancesComponent>;
  const appId = '1';
  const cfId = '2';
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DeleteAppServiceInstancesComponent],
      imports: BaseTestModules,
      providers: [
        generateTestEntityServiceProvider(
          appId,
          entityFactory(applicationSchemaKey),
          new GetApplication(appId, cfId)
        ),
        generateTestApplicationServiceProvider(cfId, appId),
        ApplicationEnvVarsService,
        DatePipe
      ],
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [TableHeaderSelectComponent],
      },
    }).compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DeleteAppServiceInstancesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
