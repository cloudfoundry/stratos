import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../core/core.module';
import { SharedModule } from '../../shared/shared.module';
import { appReducers } from '../../store/reducers.module';
import { AcmeLoginComponent } from './acme-login.component';

describe('AcmeLoginComponent', () => {
  let component: AcmeLoginComponent;
  let fixture: ComponentFixture<AcmeLoginComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [AcmeLoginComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        StoreModule.forRoot(appReducers)
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AcmeLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
