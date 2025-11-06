import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { EndpointModel } from '../../../../../../store/src/types/endpoint.types';
import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { BackupEndpointsService } from '../backup-endpoints.service';
import { BackupEndpointTypes } from '../backup-restore.types';
import { BackupCheckboxCellComponent } from './backup-checkbox-cell.component';

describe('BackupCheckboxCellComponent', () => {
  let component: BackupCheckboxCellComponent;
  let fixture: ComponentFixture<BackupCheckboxCellComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        BackupCheckboxCellComponent
      ],
      providers: [
        
        BackupEndpointsService
      ,
        provideZonelessChangeDetection()
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupCheckboxCellComponent);
    component = fixture.componentInstance;
    component.config = {
      type: BackupEndpointTypes.ENDPOINT
    };
    component.row = {
      guid: 'test',
      cnsi_type: 'metrics',
    } as EndpointModel;
    component.service.initialize([{
      guid: 'test'
    } as EndpointModel]);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
