import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DateTimeComponent } from './date-time.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MDAppModule } from '../../../core/md.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('DateTimeComponent', () => {
  let component: DateTimeComponent;
  let fixture: ComponentFixture<DateTimeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [DateTimeComponent],
      imports: [
        FormsModule,
        ReactiveFormsModule,
        MDAppModule,
        NoopAnimationsModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DateTimeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
