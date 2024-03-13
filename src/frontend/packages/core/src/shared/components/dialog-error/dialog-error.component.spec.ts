import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { DialogErrorComponent } from './dialog-error.component';

describe('DialogErrorComponent', () => {
  let component: DialogErrorComponent;
  let fixture: ComponentFixture<DialogErrorComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [
        CommonModule,
        CoreModule,
        NoopAnimationsModule
      ],
      declarations: [DialogErrorComponent]
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
