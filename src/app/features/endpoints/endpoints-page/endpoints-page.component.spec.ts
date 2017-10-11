import { it } from '@angular/cli/lib/ast-tools/spec-utils';
import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { appReducers } from '../../../store/reducers.module';
import { EndpointsPageComponent } from './endpoints-page.component';

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EndpointsPageComponent],
      imports: [
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        BrowserAnimationsModule,
        StoreModule.forRoot(
          appReducers
        )
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EndpointsPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
