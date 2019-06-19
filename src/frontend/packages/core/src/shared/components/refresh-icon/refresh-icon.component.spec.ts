import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RefreshIconComponent } from './refresh-icon.component';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MDAppModule } from '../../../core/md.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

describe('RefreshIconComponent', () => {
  let component: RefreshIconComponent;
  let fixture: ComponentFixture<RefreshIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [RefreshIconComponent],
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
    fixture = TestBed.createComponent(RefreshIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
