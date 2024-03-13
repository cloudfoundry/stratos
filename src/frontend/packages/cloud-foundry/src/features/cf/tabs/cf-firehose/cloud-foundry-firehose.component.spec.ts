import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import {
  generateCfBaseTestModules,
  generateTestCfEndpointServiceProvider,
} from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryFirehoseComponent } from './cloud-foundry-firehose.component';

describe('CloudFoundryFirehoseComponent', () => {
  let component: CloudFoundryFirehoseComponent;
  let fixture: ComponentFixture<CloudFoundryFirehoseComponent>;

  beforeEach(
    waitForAsync(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryFirehoseComponent],
        imports: generateCfBaseTestModules(),
        providers: [...generateTestCfEndpointServiceProvider()]
      }).compileComponents();
    })
  );

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryFirehoseComponent);
    component = fixture.componentInstance;
    // fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
