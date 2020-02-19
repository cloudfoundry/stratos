import { CommonModule } from '@angular/common';
import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { RouterTestingModule } from '@angular/router/testing';
import { StoreModule } from '@ngrx/store';

import { appReducers } from '../../../../../store/src/reducers.module';
import { TabNavService } from '../../../../tab-nav.service';
import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { createBasicStoreModule } from '@stratos/store/testing';
import { CoreModule } from '../../../core/core.module';
import { SharedModule } from '../../../shared/shared.module';
import { EndpointsPageComponent } from './endpoints-page.component';
import { SidePanelService } from './../../../shared/services/side-panel.service';

describe('EndpointsPageComponent', () => {
  let component: EndpointsPageComponent;
  let fixture: ComponentFixture<EndpointsPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [EndpointsPageComponent],
      imports: [
        CoreTestingModule,
        createBasicStoreModule(),
        CommonModule,
        CoreModule,
        SharedModule,
        RouterTestingModule,
        NoopAnimationsModule,
        StoreModule.forRoot(
          appReducers
        ),
        NoopAnimationsModule
      ],
      providers: [TabNavService, SidePanelService]
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
