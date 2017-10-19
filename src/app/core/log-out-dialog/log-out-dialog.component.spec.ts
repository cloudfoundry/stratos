import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogOutDialogComponent } from './log-out-dialog.component';

describe('LogOutDialogComponent', () => {
  let component: LogOutDialogComponent;
  let fixture: ComponentFixture<LogOutDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogOutDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogOutDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
