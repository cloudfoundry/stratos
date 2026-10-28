import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll, vi } from 'vitest';
import { NoContentMessageComponent } from './no-content-message.component';

describe('NoContentMessageComponent', () => {
  let component: NoContentMessageComponent;
  let fixture: ComponentFixture<NoContentMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideZonelessChangeDetection()],
      imports: [
        NoContentMessageComponent,
      ]
    });
      TestBed.compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(NoContentMessageComponent);
    component = fixture.componentInstance;
    component.secondLine = {
      link: '',
      linkText: '',
      text: '',
    };
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('puts the toolbar prompt just below the toolbar button', () => {
    vi.useFakeTimers();
    const button = document.createElement('button');
    button.id = 'toolbar-target';
    document.body.appendChild(button);
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ bottom: 60, right: 900 } as DOMRect);

    const f = TestBed.createComponent(NoContentMessageComponent);
    f.componentInstance.toolbarLink = { text: 'Create an API key' };
    f.componentRef.setInput('toolbarAlign', 'toolbar-target');
    f.detectChanges();
    const link: HTMLElement = f.nativeElement.querySelector('.app-no-content-container__link');
    vi.spyOn(link.parentElement!, 'getBoundingClientRect').mockReturnValue({ top: 200, right: 1000 } as DOMRect);
    vi.advanceTimersByTime(500);

    expect(link.style.top).toBe('-140px');
    expect(link.style.right).toBe('97px');
    button.remove();
    vi.useRealTimers();
  });

  // The page header draws over anything inside its bar, so the prompt's
  // arrow starts below the bar, not below the button.
  it('puts the toolbar prompt below the page header that holds the button', () => {
    vi.useFakeTimers();
    const bar = document.createElement('div');
    bar.className = 'page-header-outer';
    const button = document.createElement('button');
    button.id = 'toolbar-target';
    bar.appendChild(button);
    document.body.appendChild(bar);
    vi.spyOn(button, 'getBoundingClientRect').mockReturnValue({ bottom: 60, right: 900 } as DOMRect);
    vi.spyOn(bar, 'getBoundingClientRect').mockReturnValue({ bottom: 78, right: 1000 } as DOMRect);

    const f = TestBed.createComponent(NoContentMessageComponent);
    f.componentInstance.toolbarLink = { text: 'Create an API key' };
    f.componentRef.setInput('toolbarAlign', 'toolbar-target');
    f.detectChanges();
    const link: HTMLElement = f.nativeElement.querySelector('.app-no-content-container__link');
    vi.spyOn(link.parentElement!, 'getBoundingClientRect').mockReturnValue({ top: 200, right: 1000 } as DOMRect);
    vi.advanceTimersByTime(500);

    expect(link.style.top).toBe('-122px');
    expect(link.style.right).toBe('97px');
    bar.remove();
    vi.useRealTimers();
  });
});
