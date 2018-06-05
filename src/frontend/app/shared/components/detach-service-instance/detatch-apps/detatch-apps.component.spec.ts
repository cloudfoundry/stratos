import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DetatchAppsComponent } from './detatch-apps.component';

describe('DetatchAppsComponent', () => {
  let component: DetatchAppsComponent;
  let fixture: ComponentFixture<DetatchAppsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DetatchAppsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DetatchAppsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
