import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../store/reducers.module';
import { CreateApplicationStep1Component } from './create-application-step1.component';
import { getInitialTestStoreState } from '../../../../test-framework/store-test-helper';

describe('CreateApplicationStep1Component', () => {
  let component: CreateApplicationStep1Component;
  let fixture: ComponentFixture<CreateApplicationStep1Component>;

  const initialState = { ...getInitialTestStoreState() };

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStep1Component],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers,
          {
            initialState
          }
        )
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep1Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
