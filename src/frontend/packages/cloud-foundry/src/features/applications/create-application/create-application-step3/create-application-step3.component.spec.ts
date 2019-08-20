import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../../../core/src/core/core.module';
import { SharedModule } from '../../../../../../core/src/shared/shared.module';
import { appReducers } from '../../../../../../store/src/reducers.module';
import { CreateApplicationStep3Component } from './create-application-step3.component';

describe('CreateApplicationStep3Component', () => {
  let component: CreateApplicationStep3Component;
  let fixture: ComponentFixture<CreateApplicationStep3Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStep3Component],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        RouterTestingModule,
        StoreModule.forRoot(
          appReducers
        )
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep3Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
