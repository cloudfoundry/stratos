import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryFeatureFlagsComponent } from './cloud-foundry-feature-flags.component';
import { getBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseCF } from '../../cf-page.types';

describe('CloudFoundryFeatureFlagsComponent', () => {
  let component: CloudFoundryFeatureFlagsComponent;
  let fixture: ComponentFixture<CloudFoundryFeatureFlagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryFeatureFlagsComponent],
      imports: [...getBaseTestModules],
      providers: [BaseCF]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryFeatureFlagsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
