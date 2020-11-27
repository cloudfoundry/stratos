import { DatePipe } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../../core/src/tab-nav.service';
import { CFBaseTestModules } from '../../../../../test-framework/cf-test-helper';
import { generateTestCfEndpointServiceProvider } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryQuotasComponent } from './cloud-foundry-quotas.component';

describe('CloudFoundryQuotasComponent', () => {
  let component: CloudFoundryQuotasComponent;
  let fixture: ComponentFixture<CloudFoundryQuotasComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryQuotasComponent],
      providers: [generateTestCfEndpointServiceProvider(), TabNavService, DatePipe],
      imports: [...CFBaseTestModules]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryQuotasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
