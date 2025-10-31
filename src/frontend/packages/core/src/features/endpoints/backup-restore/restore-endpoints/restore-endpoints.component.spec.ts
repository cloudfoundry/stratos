import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../../test-framework/core-test.helper';
import { SharedModule } from '../../../../shared/shared.module';
import { TabNavService } from '../../../../tab-nav.service';
import { RestoreEndpointsComponent } from './restore-endpoints.component';

describe('RestoreEndpointsComponent', () => {
  let component: RestoreEndpointsComponent;
  let fixture: ComponentFixture<RestoreEndpointsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        SharedModule,
        RestoreEndpointsComponent
      ],
      providers: [
        TabNavService
      ]
    
    })
      .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RestoreEndpointsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
