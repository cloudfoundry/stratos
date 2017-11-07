import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AppEventDetailDialogComponentComponent } from './app-event-detail-dialog-component.component';

describe('AppEventDetailDialogComponentComponent', () => {
  let component: AppEventDetailDialogComponentComponent;
  let fixture: ComponentFixture<AppEventDetailDialogComponentComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AppEventDetailDialogComponentComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AppEventDetailDialogComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
