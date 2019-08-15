import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TabNavService } from '../../../../../core/tab-nav.service';
import { BaseTestModules } from '../../../../../core/test-framework/cloud-foundry-endpoint-service.helper';
import { CfOrgSpaceDataService } from '../../../shared/data-services/cf-org-space-service.service';
import { CloudFoundryService } from '../../../shared/data-services/cloud-foundry.service';
import { ServicesWallComponent } from './services-wall.component';

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
        CfOrgSpaceDataService,
        TabNavService
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
