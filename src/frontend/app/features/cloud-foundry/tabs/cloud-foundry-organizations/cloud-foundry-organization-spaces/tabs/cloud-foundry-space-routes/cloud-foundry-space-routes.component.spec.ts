import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundrySpaceRoutesComponent } from './cloud-foundry-space-routes.component';
import { getBaseTestModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('CloudFoundrySpaceRoutesComponent', () => {
  let component: CloudFoundrySpaceRoutesComponent;
  let fixture: ComponentFixture<CloudFoundrySpaceRoutesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundrySpaceRoutesComponent],
      imports: [...getBaseTestModules]
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
