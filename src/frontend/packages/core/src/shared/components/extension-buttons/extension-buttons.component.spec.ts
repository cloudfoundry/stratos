import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { BaseTestModulesNoShared } from '../../../../test-framework/core-test.helper';
import { ExtensionButtonsComponent } from './extension-buttons.component';

describe('ExtensionButtonsComponent', () => {
  let component: ExtensionButtonsComponent;
  let fixture: ComponentFixture<ExtensionButtonsComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        ...BaseTestModulesNoShared,
        ExtensionButtonsComponent
      ],
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ExtensionButtonsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
