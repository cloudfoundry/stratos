import { AfterViewInit, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, ViewChild, inject, signal } from '@angular/core';

/**
 * A scroll area with the edge fades the lists use (signal-list): a shade at
 * the bottom or right edge while scrolling that way would reveal more. The
 * scrollbar is hidden, as in the lists, so the fade is the only cue.
 *
 * The host sizes the area: give it a height (or let a flex/grid parent do
 * so) for vertical scrolling; horizontal scrolling needs only a width.
 */
@Component({
  selector: 'app-scroll-fade',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'relative block min-h-0 min-w-0' },
  template: `
    <div #body data-test="scroll-fade-body" class="h-full overflow-auto scrollbar-none">
      <ng-content></ng-content>
    </div>
    @if (canScrollDown()) {
      <div data-test="scroll-fade-bottom" aria-hidden="true"
           class="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-10 bg-gradient-to-t from-black/30 via-black/10 to-transparent dark:from-white/25 dark:via-white/10"></div>
    }
    @if (canScrollRight()) {
      <div data-test="scroll-fade-right" aria-hidden="true"
           class="pointer-events-none absolute inset-y-0 right-0 z-20 w-10 bg-gradient-to-l from-black/30 via-black/10 to-transparent dark:from-white/25 dark:via-white/10"></div>
    }
  `,
})
export class ScrollFadeComponent implements AfterViewInit {
  @ViewChild('body', { static: true }) private body!: ElementRef<HTMLElement>;

  readonly canScrollDown = signal(false);
  readonly canScrollRight = signal(false);

  private readonly destroyRef = inject(DestroyRef);

  ngAfterViewInit(): void {
    const el = this.body.nativeElement;
    const measure = () => {
      // 2px tolerance, as in signal-list: sizes round to integers while the
      // scroll position is fractional.
      this.canScrollDown.set(el.scrollTop + el.clientHeight < el.scrollHeight - 2);
      this.canScrollRight.set(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
    };
    measure();
    el.addEventListener('scroll', measure, { passive: true });
    // Resizes change the visible area; content changes change the scroll size.
    const resize = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(measure) : undefined;
    resize?.observe(el);
    const mutation = typeof MutationObserver !== 'undefined' ? new MutationObserver(measure) : undefined;
    mutation?.observe(el, { childList: true, subtree: true, characterData: true });
    this.destroyRef.onDestroy(() => {
      el.removeEventListener('scroll', measure);
      resize?.disconnect();
      mutation?.disconnect();
    });
  }
}
