import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ReleasesTabComponent } from './releases-tab.component';

describe('ReleasesTabComponent', () => {
  let component: ReleasesTabComponent;
  let fixture: ComponentFixture<ReleasesTabComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ReleasesTabComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ReleasesTabComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
