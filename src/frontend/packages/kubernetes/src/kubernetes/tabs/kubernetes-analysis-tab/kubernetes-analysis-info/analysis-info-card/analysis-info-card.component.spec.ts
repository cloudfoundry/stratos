import { HttpClient } from '@angular/common/http';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { of } from 'rxjs';

import { AnalysisInfoCardComponent } from './analysis-info-card.component';

describe('AnalysisInfoCardComponent', () => {
  let component: AnalysisInfoCardComponent;
  let fixture: ComponentFixture<AnalysisInfoCardComponent>;
  // Answers each description request at once with markdown naming its URL.
  const http = { get: vi.fn((url: string) => of(`Description from **${url}**`)) };

  beforeEach(async () => {
    http.get.mockClear();
    await TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        { provide: HttpClient, useValue: http },
      ],
      imports: [
        AnalysisInfoCardComponent,
      ]
    }).compileComponents();
  });

  beforeEach(async () => {
    fixture = TestBed.createComponent(AnalysisInfoCardComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('shows the description of the analyzer, and keeps it for one without a description', async () => {
    const body = () => fixture.nativeElement.querySelector('.markdown-body').innerHTML;
    expect(http.get).not.toHaveBeenCalled();

    fixture.componentRef.setInput('analyzer', { name: 'popeye', descriptionUrl: '/popeye.md' });
    await fixture.whenStable();
    expect(body()).toContain('<strong>/popeye.md</strong>');

    fixture.componentRef.setInput('analyzer', { name: 'other' });
    await fixture.whenStable();
    expect(body()).toContain('<strong>/popeye.md</strong>');
    expect(http.get).toHaveBeenCalledTimes(1);
  });
});
