import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import {
  generateTestCfEndpointServiceProvider,
  BaseTestModules,
} from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryFirehoseComponent } from './cloud-foundry-firehose.component';

describe('CloudFoundryFirehoseComponent', () => {
  let component: CloudFoundryFirehoseComponent;
  let fixture: ComponentFixture<CloudFoundryFirehoseComponent>;

  beforeEach(
    async(() => {
      TestBed.configureTestingModule({
        declarations: [CloudFoundryFirehoseComponent],
        imports: [...BaseTestModules],
        providers: [...generateTestCfEndpointServiceProvider()]
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
