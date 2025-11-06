import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { SharedModule } from '../../../../shared/shared.module';
import { TabNavService } from '../../../../tab-nav.service';
import { BackupEndpointsComponent } from './backup-endpoints.component';

describe('BackupEndpointsComponent', () => {
  let component: BackupEndpointsComponent;
  let fixture: ComponentFixture<BackupEndpointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        BackupEndpointsComponent
      ],
      providers: [
        
        TabNavService
      ,
        provideZonelessChangeDetection()
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
