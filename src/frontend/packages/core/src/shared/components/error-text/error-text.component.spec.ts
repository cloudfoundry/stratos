import { provideZonelessChangeDetection } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorPiece, htmlToPieces } from '@stratosui/store';
import { beforeEach, describe, expect, it } from 'vitest';

import { ErrorTextComponent } from './error-text.component';

describe('ErrorTextComponent', () => {
  let fixture: ComponentFixture<ErrorTextComponent>;

  const render = async (pieces: readonly ErrorPiece[]): Promise<HTMLElement> => {
    fixture.componentRef.setInput('pieces', pieces);
    await fixture.whenStable();
    return fixture.nativeElement as HTMLElement;
  };

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    fixture = TestBed.createComponent(ErrorTextComponent);
  });

  it('shows each piece in a span styled for it, keeping line breaks', async () => {
    const host = await render([
      { text: 'Delete failed: ', style: 'text' },
      { text: '502 Bad Gateway', style: 'heading' },
      { text: '\nsee ', style: 'text' },
      { text: 'logs', style: 'strong' },
      { text: ' or ', style: 'text' },
      { text: 'retry', style: 'em' },
      { text: ' ', style: 'text' },
      { text: '/v2/catalog', style: 'code' },
    ]);
    expect(host.classList).toContain('whitespace-pre-line');
    const spans = Array.from(host.querySelectorAll('span'));
    expect(spans.map(s => [s.textContent, s.className])).toEqual([
      ['Delete failed: ', ''],
      ['502 Bad Gateway', 'font-semibold'],
      ['\nsee ', ''],
      ['logs', 'font-semibold'],
      [' or ', ''],
      ['retry', 'italic'],
      [' ', ''],
      ['/v2/catalog', 'font-mono'],
    ]);
  });

  it('shows markup in the text as text, never as elements', async () => {
    const host = await render([
      ...htmlToPieces('<p>&lt;img src=x onerror=alert(1)&gt; &lt;script&gt;alert(2)&lt;/script&gt;</p>'),
      { text: ' <b>bold?</b>', style: 'strong' },
    ]);
    expect(host.querySelector('img, script, b')).toBeNull();
    expect(host.textContent).toBe('<img src=x onerror=alert(1)> <script>alert(2)</script> <b>bold?</b>');
  });

  it('shows nothing for no pieces', async () => {
    const host = await render([]);
    expect(host.textContent).toBe('');
  });
});
