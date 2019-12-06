import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseResourcePreviewComponent } from './helm-release-resource-preview.component';

describe('HelmReleaseResourcePreviewComponent', () => {
  let component: HelmReleaseResourcePreviewComponent;
  let fixture: ComponentFixture<HelmReleaseResourcePreviewComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseResourcePreviewComponent ]
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
