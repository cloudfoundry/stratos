import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { SharedModule } from '../../../../shared/shared.module';
import { TabNavService } from '../../../../tab-nav.service';
import { BackupRestoreEndpointsComponent } from './backup-restore-endpoints.component';

describe('BackupRestoreEndpointsComponent', () => {
  let component: BackupRestoreEndpointsComponent;
  let fixture: ComponentFixture<BackupRestoreEndpointsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        BackupRestoreEndpointsComponent
      ],
      providers: [
        TabNavService
      ],
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BackupRestoreEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
