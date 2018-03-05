import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CloudFoundryBuildPacksComponent } from './cloud-foundry-build-packs.component';
import { getBaseTestModules } from '../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { BaseCF } from '../../cf-page.types';

describe('CloudFoundryBuildPacksComponent', () => {
  let component: CloudFoundryBuildPacksComponent;
  let fixture: ComponentFixture<CloudFoundryBuildPacksComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CloudFoundryBuildPacksComponent],
      imports: [...getBaseTestModules],
      providers: [BaseCF]
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
