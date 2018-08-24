import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RoutesTabComponent } from './routes-tab.component';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { generateTestApplicationServiceProvider } from '../../../../../../../test-framework/application-service-helper';
import { ApplicationEnvVarsService } from '../../build-tab/application-env-vars.service';
import { BrowserDynamicTestingModule } from '@angular/platform-browser-dynamic/testing';
import {
  TableHeaderSelectComponent
} from '../../../../../../../shared/components/list/list-table/table-header-select/table-header-select.component';

describe('RoutesTabComponent', () => {
  let component: RoutesTabComponent;
  let fixture: ComponentFixture<RoutesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RoutesTabComponent],
      imports: [...BaseTestModules],
      providers: [
        generateTestApplicationServiceProvider('test', 'test'),
        ApplicationEnvVarsService
      ]
    });
    TestBed.overrideModule(BrowserDynamicTestingModule, {
      set: {
        entryComponents: [TableHeaderSelectComponent],
      },
    }).compileComponents();
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
