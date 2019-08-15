import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { IApp } from '../../../../../../../../core/src/core/cf-api.types';
import { CoreModule } from '../../../../../../../../core/src/core/core.module';
import {
  ApplicationStateService,
} from '../../../../../../../../core/src/shared/components/application-state/application-state.service';
import { PaginationMonitorFactory } from '../../../../../../../../core/src/shared/monitors/pagination-monitor.factory';
import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { createBasicStoreModule } from '../../../../../../../../core/test-framework/store-test-helper';
import { APIResourceMetadata } from '../../../../../../../../store/src/types/api.types';
import { CardAppComponent } from './card-app.component';

describe('CardAppComponent', () => {
  let component: CardAppComponent;
  let fixture: ComponentFixture<CardAppComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        CoreModule,
        RouterTestingModule,
        createBasicStoreModule(),
        SharedModule
      ],
      providers: [
        ApplicationStateService,
        PaginationMonitorFactory
      ]
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CardAppComponent);
    component = fixture.componentInstance;
    component.row = {
      entity: {
        state: '',
        space: {
          entity: {
            name: '',
            organization: {
              entity: {
                name: '',
              }
            },
          },
        },
      } as IApp,
      metadata: {} as APIResourceMetadata,
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
