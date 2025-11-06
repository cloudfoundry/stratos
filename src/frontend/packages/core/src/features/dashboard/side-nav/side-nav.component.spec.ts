import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from "../test-framework/core-test.helper";

import { CoreTestingModule } from '../../../../test-framework/core-test.modules';
import { CustomizationService } from '../../../core/customizations.types';
import { MDAppModule } from '../../../core/md.module';
import { SideNavComponent } from './side-nav.component';


describe('SideNavComponent', () => {
  let component: SideNavComponent;
  let fixture: ComponentFixture<SideNavComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      imports: [
        RouterTestingModule,
        MDAppModule,
        CoreTestingModule,
        createBasicStoreModule(),
        SideNavComponent
      ],
      providers: [
        CustomizationService
      ]
    
    })
      .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SideNavComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
