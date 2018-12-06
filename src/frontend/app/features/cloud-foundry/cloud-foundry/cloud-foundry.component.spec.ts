import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryComponent } from './cloud-foundry.component';
import {
  BaseTestModules,
  getBaseProviders,
  generateTestCfServiceProvider
} from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { createBasicStoreModule } from '../../../test-framework/store-test-helper';
import { PaginationMonitorFactory } from '../../../shared/monitors/pagination-monitor.factory';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';

describe('CloudFoundryComponent', () => {
  let component: CloudFoundryComponent;
  let fixture: ComponentFixture<CloudFoundryComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryComponent],
        imports: [...BaseTestModules, BrowserAnimationsModule],
        providers: [PaginationMonitorFactory, CloudFoundryService, generateTestCfServiceProvider()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
