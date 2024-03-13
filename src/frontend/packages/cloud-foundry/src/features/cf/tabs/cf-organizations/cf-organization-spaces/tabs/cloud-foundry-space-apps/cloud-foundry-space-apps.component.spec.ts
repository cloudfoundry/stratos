import { DatePipe } from '@angular/common';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../../test-framework/cloud-foundry-space.service.mock';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceAppsComponent } from './cloud-foundry-space-apps.component';

describe('CloudFoundrySpaceAppsComponent', () => {
  let component: CloudFoundrySpaceAppsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceAppsComponent],
      imports: generateCfBaseTestModules(),
      providers: [
        DatePipe,
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
