import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { LogStreamViewerComponent } from './logstream-viewer.component';

describe('LogStreamViewerComponent', () => {
  let component: LogStreamViewerComponent;
  let fixture: ComponentFixture<LogStreamViewerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ LogStreamViewerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(LogStreamViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
