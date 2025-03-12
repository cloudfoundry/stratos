import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { HomeShortcutsComponent } from './home-shortcuts.component';

describe('HomeShortcutsComponent', () => {
  let component: HomeShortcutsComponent;
  let fixture: ComponentFixture<HomeShortcutsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ HomeShortcutsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(HomeShortcutsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
