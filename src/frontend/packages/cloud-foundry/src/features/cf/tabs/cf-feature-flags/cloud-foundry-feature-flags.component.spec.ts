import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryFeatureFlagsComponent } from './cloud-foundry-feature-flags.component';

describe('CloudFoundryFeatureFlagsComponent', () => {
  let component: CloudFoundryFeatureFlagsComponent;
  let fixture: ComponentFixture<CloudFoundryFeatureFlagsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryFeatureFlagsComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace]
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
