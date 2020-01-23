import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { KubernetesBaseTestModules } from '../../../../../kubernetes.testing.module';
import { HelmReleaseResourcePreviewComponent } from './helm-release-resource-preview.component';

describe('HelmReleaseResourcePreviewComponent', () => {
  let component: HelmReleaseResourcePreviewComponent;
  let fixture: ComponentFixture<HelmReleaseResourcePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        ...KubernetesBaseTestModules
      ],
      declarations: [HelmReleaseResourcePreviewComponent]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourcePreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
