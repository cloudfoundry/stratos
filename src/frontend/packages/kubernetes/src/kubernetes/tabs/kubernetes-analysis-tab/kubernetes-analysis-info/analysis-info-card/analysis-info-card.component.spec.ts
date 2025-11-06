import { HttpClientTestingModule } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';

import { AnalysisInfoCardComponent } from './analysis-info-card.component';

describe('AnalysisInfoCardComponent', () => {
  let component: AnalysisInfoCardComponent;
  let fixture: ComponentFixture<AnalysisInfoCardComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [ AnalysisInfoCardComponent ],
      imports: [
        HttpClientTestingModule,
      ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnalysisInfoCardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
