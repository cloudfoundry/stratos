import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NewApplicationBaseStepComponent } from './new-application-base-step.component';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { createBasicStoreModule } from '../../../../test-framework/store-test-helper';
import { RouterTestingModule } from '@angular/router/testing';

describe('NewApplicationBaseStepComponent', () => {
  let component: NewApplicationBaseStepComponent;
  let fixture: ComponentFixture<NewApplicationBaseStepComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [NewApplicationBaseStepComponent],
      imports: [
        CoreModule,
        SharedModule,
        createBasicStoreModule(),
        RouterTestingModule
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NewApplicationBaseStepComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
