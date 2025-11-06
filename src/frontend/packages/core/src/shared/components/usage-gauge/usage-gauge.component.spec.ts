import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { UsageGaugeComponent } from './usage-gauge.component';
import { PercentagePipe } from '../../pipes/percentage.pipe';
import { CoreModule } from '../../../core/core.module';
import { UtilsService } from '../../../core/utils.service';

describe('UsageGaugeComponent', () => {
  let component: UsageGaugeComponent;
  let fixture: ComponentFixture<UsageGaugeComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [
        UsageGaugeComponent, // Now standalone (includes PercentagePipe)
        CoreModule,
      ],
      providers: [
        
        UtilsService,
      ,
        provideZonelessChangeDetection()
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(UsageGaugeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
