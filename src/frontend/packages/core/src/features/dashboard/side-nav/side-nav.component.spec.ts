import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { RouterTestingModule } from '@angular/router/testing';
import { createBasicStoreModule } from '@stratosui/store/testing';

import { CoreTestingModule } from "@test-framework/core-test.modules";
import { CustomizationService, MDAppModule } from '@stratosui/core';
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
        SideNavComponent,
      ],
      providers: [
        
        CustomizationService,
        provideZonelessChangeDetection(),
      ]
    
    });
      TestBed.compileComponents();
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
