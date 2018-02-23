import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryFirehoseComponent } from './cloud-foundry-firehose.component';
import {
  getBaseTestModules,
  generateTestCfEndpointServiceProvider
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryEndpointService } from '../../services/cloud-foundry-endpoint.service';

describe('CloudFoundryFirehoseComponent', () => {
  let component: CloudFoundryFirehoseComponent;
  let fixture: ComponentFixture<CloudFoundryFirehoseComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryFirehoseComponent],
        imports: [...getBaseTestModules],
        providers: [generateTestCfEndpointServiceProvider()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryFirehoseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
