import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseCardComponent } from './helm-release-card.component';

describe('HelmReleaseCardComponent', () => {
  let component: HelmReleaseCardComponent;
  let fixture: ComponentFixture<HelmReleaseCardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseCardComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
