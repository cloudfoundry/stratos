import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogErrorComponent } from './dialog-error.component';

describe('DialogErrorComponent', () => {
  let component: DialogErrorComponent;
  let fixture: ComponentFixture<DialogErrorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        DialogErrorComponent
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DialogErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
