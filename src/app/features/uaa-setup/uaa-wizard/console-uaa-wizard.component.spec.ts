import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';
import { SteppersComponent } from '../stepper/steppers/steppers.component';
import { MDAppModule } from './../../md/md.module';
import { StepComponent } from './../stepper/step/step.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ConsoleUaaWizardComponent } from './console-uaa-wizard.component';

describe('ConsoleUaaWizardComponent', () => {
  let component: ConsoleUaaWizardComponent;
  let fixture: ComponentFixture<ConsoleUaaWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ConsoleUaaWizardComponent, StepComponent, SteppersComponent ],
      imports: [
	RouterTestingModule,
	FormsModule,
	ReactiveFormsModule,
	MDAppModule,
	StoreModule.forRoot({}),
	BrowserAnimationsModule
      ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConsoleUaaWizardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
