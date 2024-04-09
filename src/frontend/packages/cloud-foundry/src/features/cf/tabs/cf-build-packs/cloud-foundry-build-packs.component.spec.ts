import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { generateCfBaseTestModules } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';
import { CloudFoundryBuildPacksComponent } from './cloud-foundry-build-packs.component';

describe('CloudFoundryBuildPacksComponent', () => {
  let component: CloudFoundryBuildPacksComponent;
  let fixture: ComponentFixture<CloudFoundryBuildPacksComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryBuildPacksComponent],
      imports: generateCfBaseTestModules(),
      providers: [ActiveRouteCfOrgSpace]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CloudFoundryBuildPacksComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
