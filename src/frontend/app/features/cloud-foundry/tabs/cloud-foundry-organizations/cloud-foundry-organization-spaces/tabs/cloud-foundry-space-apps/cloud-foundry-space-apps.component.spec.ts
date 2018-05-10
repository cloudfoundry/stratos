import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceAppsComponent } from './cloud-foundry-space-apps.component';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { DatePipe } from '@angular/common';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../test-framework/cloud-foundry-space.service.mock';

describe('CloudFoundrySpaceAppsComponent', () => {
  let component: CloudFoundrySpaceAppsComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceAppsComponent],
      imports: [...BaseTestModules],
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
