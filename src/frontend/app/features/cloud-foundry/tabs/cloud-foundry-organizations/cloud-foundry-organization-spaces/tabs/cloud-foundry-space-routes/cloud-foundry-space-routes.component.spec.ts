import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceRoutesComponent } from './cloud-foundry-space-routes.component';
import { BaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { CloudFoundrySpaceService } from '../../../../../services/cloud-foundry-space.service';
import { CloudFoundrySpaceServiceMock } from '../../../../../../../test-framework/cloud-foundry-space.service.mock';

describe('CloudFoundrySpaceRoutesComponent', () => {
  let component: CloudFoundrySpaceRoutesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceRoutesComponent],
      imports: [...BaseTestModules],
      providers: [
        { provide: CloudFoundrySpaceService, useClass: CloudFoundrySpaceServiceMock }
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundrySpaceRoutesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
