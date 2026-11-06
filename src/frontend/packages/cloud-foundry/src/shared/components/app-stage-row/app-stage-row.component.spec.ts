import { TestBed, ComponentFixture } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';

import { AppStageRowComponent } from './app-stage-row.component';

describe('AppStageRowComponent', () => {
  let fixture: ComponentFixture<AppStageRowComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({ imports: [AppStageRowComponent] });
    fixture = TestBed.createComponent(AppStageRowComponent);
  });

  it('renders done / now / pending markers', () => {
    fixture.componentRef.setInput('stages', [
      { code: 'STAGING',  label: 'Staging',  index: 1, of: 3, enteredAt: new Date().toISOString() },
      { code: 'STARTING', label: 'Starting', index: 2, of: 3, enteredAt: new Date().toISOString() },
    ]);
    fixture.detectChanges();
    const html: string = fixture.nativeElement.outerHTML;
    expect(html).toContain('✓');   // done marker for the first stage
    expect(html).toContain('●');   // current marker for the second stage
    expect(html).toContain('○');   // pending placeholder (of=3, only 2 received)
  });

  it('hides when stages is empty', () => {
    fixture.componentRef.setInput('stages', []);
    fixture.detectChanges();
    expect(fixture.nativeElement.children.length).toBe(0);
  });

  it('assigns done status to all stages except the last', () => {
    fixture.componentRef.setInput('stages', [
      { code: 'A', label: 'Alpha', index: 1, of: 2, enteredAt: new Date().toISOString() },
      { code: 'B', label: 'Beta',  index: 2, of: 2, enteredAt: new Date().toISOString() },
    ]);
    fixture.detectChanges();
    const spans: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('span');
    // First stage → done (text-success class)
    expect(spans[0].className).toContain('text-success');
    // Last stage → now (text-warning class)
    expect(spans[1].className).toContain('text-warning');
    expect(spans[1].className).toContain('animate-pulse');
  });

  it('does not synthesize pending stages when of <= array length', () => {
    fixture.componentRef.setInput('stages', [
      { code: 'A', label: 'Alpha', index: 1, of: 1, enteredAt: new Date().toISOString() },
    ]);
    fixture.detectChanges();
    const spans: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('span');
    // Only one stage — no placeholder
    expect(spans.length).toBe(1);
    expect(fixture.nativeElement.outerHTML).not.toContain('○');
  });

  it('updates rendered output correctly when input changes', () => {
    fixture.componentRef.setInput('stages', [
      { code: 'A', label: 'Alpha', index: 1, of: 1, enteredAt: new Date().toISOString() },
    ]);
    fixture.detectChanges();
    // One stage → no pending
    expect(fixture.nativeElement.querySelectorAll('span').length).toBe(1);

    // Add another stage with of=3 → expect one more real + one pending placeholder
    fixture.componentRef.setInput('stages', [
      { code: 'A', label: 'Alpha', index: 1, of: 3, enteredAt: new Date().toISOString() },
      { code: 'B', label: 'Beta',  index: 2, of: 3, enteredAt: new Date().toISOString() },
    ]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('span').length).toBe(3);
  });
});
