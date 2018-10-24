import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryBuildPacksComponent } from './cloud-foundry-build-packs.component';
import { BaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ActiveRouteCfOrgSpace } from '../../cf-page.types';

describe('CloudFoundryBuildPacksComponent', () => {
  let component: CloudFoundryBuildPacksComponent;
  let fixture: ComponentFixture<CloudFoundryBuildPacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryBuildPacksComponent],
      imports: [...BaseTestModules],
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
