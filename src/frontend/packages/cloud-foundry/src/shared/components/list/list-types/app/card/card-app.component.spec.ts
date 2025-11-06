import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';

import { SharedModule } from '../../../../../../../../core/src/shared/shared.module';
import { PaginationMonitorFactory } from '../../../../../../../../store/src/monitors/pagination-monitor.factory';
import { APIResourceMetadata } from '../../../../../../../../store/src/types/api.types';
import { generateCfStoreModules } from '../../../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { IApp } from '../../../../../../cf-api.types';
import { ApplicationStateService } from '../../../../../services/application-state.service';
import { CfOrgSpaceLinksComponent } from '../../../../cf-org-space-links/cf-org-space-links.component';
import { RunningInstancesComponent } from '../../../../running-instances/running-instances.component';
import { CardAppComponent } from './card-app.component';

describe('CardAppComponent', () => {
  let component: CardAppComponent;
  let fixture: ComponentFixture<CardAppComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CardAppComponent,
        RunningInstancesComponent,
        CfOrgSpaceLinksComponent,
        ...generateCfStoreModules(),
        RouterTestingModule,
        SharedModule
      ],
      providers: [
        
        ApplicationStateService,
        PaginationMonitorFactory
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();

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
