import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { DomainMismatchComponent } from './domain-mismatch.component';
import { MDAppModule } from '../../../core/md.module';
import { IntroScreenComponent } from '../../../shared/components/intro-screen/intro-screen.component';
import { StratosTitleComponent } from '../../../shared/components/stratos-title/stratos-title.component';

describe('DomainMismatchComponent', () => {
  let component: DomainMismatchComponent;
  let fixture: ComponentFixture<DomainMismatchComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      
      providers: [provideZonelessChangeDetection()],
      
      imports: [
        MDAppModule,
        DomainMismatchComponent,
        IntroScreenComponent,
        StratosTitleComponent,
      ]
    
    });
    TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(DomainMismatchComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
