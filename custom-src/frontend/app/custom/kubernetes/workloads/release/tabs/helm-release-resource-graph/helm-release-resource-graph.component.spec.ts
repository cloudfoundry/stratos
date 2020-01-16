import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseResourceGraphComponent } from './helm-release-resource-graph.component';

describe('HelmReleaseResourceGraphComponent', () => {
  let component: HelmReleaseResourceGraphComponent;
  let fixture: ComponentFixture<HelmReleaseResourceGraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseResourceGraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseResourceGraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
