import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DrillDownComponent } from './drill-down.component';
import { CommonModule } from '@angular/common';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../shared.module';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { StoreModule } from '@ngrx/store';
import { appReducers } from '../../../store/reducers.module';

describe('DrillDownComponent', () => {
  let component: DrillDownComponent;
  let fixture: ComponentFixture<DrillDownComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
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
    fixture = TestBed.createComponent(DrillDownComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
