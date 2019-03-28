import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { HelmReleaseNotesTabComponent } from './helm-release-notes-tab.component';

describe('HelmReleaseNotesTabComponent', () => {
  let component: HelmReleaseNotesTabComponent;
  let fixture: ComponentFixture<HelmReleaseNotesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ HelmReleaseNotesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HelmReleaseNotesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
