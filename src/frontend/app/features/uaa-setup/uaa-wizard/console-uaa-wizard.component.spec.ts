import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { MDAppModule } from '../../../core/md.module';
import { StepComponent } from '../../../shared/components/stepper/step/step.component';
import { SteppersComponent } from '../../../shared/components/stepper/steppers/steppers.component';
import { ConsoleUaaWizardComponent } from './console-uaa-wizard.component';
import { DotContentComponent } from '../../../core/dot-content/dot-content.component';

describe('ConsoleUaaWizardComponent', () => {
  let component: ConsoleUaaWizardComponent;
  let fixture: ComponentFixture<ConsoleUaaWizardComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ConsoleUaaWizardComponent, StepComponent, SteppersComponent, DotContentComponent],
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
