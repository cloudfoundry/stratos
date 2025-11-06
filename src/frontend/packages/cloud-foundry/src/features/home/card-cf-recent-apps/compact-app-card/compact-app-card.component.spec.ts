import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import {
  ApplicationStateIconComponent,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.component';
import {
  ApplicationStateIconPipe,
} from '../../../../../../core/src/shared/components/application-state/application-state-icon/application-state-icon.pipe';
import { generateCfBaseTestModulesNoShared } from '../../../../../test-framework/cloud-foundry-endpoint-service.helper';
import { ApplicationStateService } from '../../../../shared/services/application-state.service';
import { ActiveRouteCfOrgSpace } from '../../../cf/cf-page.types';
import { CompactAppCardComponent } from './compact-app-card.component';

describe('CompactAppCardComponent', () => {
  let component: CompactAppCardComponent;
  let fixture: ComponentFixture<CompactAppCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [
        CompactAppCardComponent,
        ApplicationStateIconComponent,
        ApplicationStateIconPipe
      ],
      imports: generateCfBaseTestModulesNoShared(),
      providers: [
        
        ApplicationStateService,
        ActiveRouteCfOrgSpace
      ,
        provideZonelessChangeDetection()
      ]
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(CompactAppCardComponent);
    component = fixture.componentInstance;
    component.app = {
      entity: {},
      metadata: {}
    };
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
