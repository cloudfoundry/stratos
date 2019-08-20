import { Component, ViewChild } from '@angular/core';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormGroup } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { CoreModule } from '../../../core/core.module';
import { UnlimitedInputComponent } from './unlimited-input.component';

@Component({
  template: `
    <form [formGroup]="formGroup">
      <app-unlimited-input name="inputName"
        placeholder="Max amount of memory an app instance can have" suffix="MB">
      </app-unlimited-input>
    </form>`
})
class WrapperComponent {
  @ViewChild(UnlimitedInputComponent)
  unlimitedInput: UnlimitedInputComponent;
  formGroup: FormGroup;

  constructor() {
    this.formGroup = new FormGroup({
      inputName: new FormControl()
    });

  }
}

describe('UnlimitedInputComponent', () => {
  let component: UnlimitedInputComponent;
  let fixture: ComponentFixture<WrapperComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [WrapperComponent, UnlimitedInputComponent],
      imports: [
        BrowserAnimationsModule,
        CoreModule,
      ],
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(WrapperComponent);
    component = fixture.componentInstance.unlimitedInput;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
