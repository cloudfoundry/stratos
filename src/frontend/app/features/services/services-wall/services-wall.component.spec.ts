import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ServicesWallComponent } from './services-wall.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';

describe('ServicesWallComponent', () => {
  let component: ServicesWallComponent;
  let fixture: ComponentFixture<ServicesWallComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ServicesWallComponent],
      imports: [
        BaseTestModules
      ],
      providers: [
        CloudFoundryService,
        CfOrgSpaceDataService
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ServicesWallComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
