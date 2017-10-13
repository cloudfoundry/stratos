import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../../core/core.module';
import { SharedModule } from '../../../../shared/shared.module';
import { appReducers } from '../../../../store/reducers.module';
import { CreateApplicationStep2Component } from './create-application-step2.component';

describe('CreateApplicationStep2Component', () => {
  let component: CreateApplicationStep2Component;
  let fixture: ComponentFixture<CreateApplicationStep2Component>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [CreateApplicationStep2Component],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        )
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateApplicationStep2Component);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
