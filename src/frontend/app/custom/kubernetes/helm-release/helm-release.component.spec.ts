import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseComponent } from './helm-release.component';
import { BaseTestModules } from '../../../test-framework/cloud-foundry-endpoint-service.helper';

describe('HelmReleaseComponent', () => {
  let component: HelmReleaseComponent;
  let fixture: ComponentFixture<HelmReleaseComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [HelmReleaseComponent],
      imports: BaseTestModules
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
