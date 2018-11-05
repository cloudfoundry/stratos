import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import { RouterTestingModule } from '@angular/router/testing';

import { IApp } from '../../../../../../core/cf-api.types';
import { CoreModule } from '../../../../../../core/core.module';
import { APIResourceMetadata } from '../../../../../../store/types/api.types';
import { createBasicStoreModule } from '../../../../../../test-framework/store-test-helper';
import { PaginationMonitorFactory } from '../../../../../monitors/pagination-monitor.factory';
import { SharedModule } from '../../../../../shared.module';
import { ApplicationStateService } from '../../../../application-state/application-state.service';
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
