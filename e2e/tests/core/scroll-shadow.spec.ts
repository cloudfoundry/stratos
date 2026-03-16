import { test, expect } from '../../fixtures/test-base';

/**
 * Scroll Shadow Diagnostic Tests (FWT-815.2)
 *
 * Inspects the actual DOM/CSS state of the scroll shadow overlay
 * to diagnose rendering issues. Reports "expected X but got Y" style
 * diagnostics for computed styles, dimensions, and visibility.
 *
 * Run against adepttech:
 *   STRATOS_E2E_BASE_URL=https://console.run.adepttech.ca \
 *   STRATOS_E2E_PROFILE=adepttech npx playwright test scroll-shadow
 */

test.describe('Scroll Shadow (FWT-815.2)', () => {

  /** Navigate to Applications page and wait for cards to render */
  async function goToAppsPage(page: any): Promise<boolean> {
    const appsNav = page.locator('a').filter({ hasText: /Applications/i }).first();
    const visible = await appsNav.isVisible({ timeout: 10000 }).catch(() => false);
    if (!visible) return false;
    await appsNav.click();
    await page.waitForLoadState('networkidle');
    // Wait for cards or table rows to actually appear
    try {
      await page.locator('app-cards .card, app-table table').first().waitFor({ state: 'visible', timeout: 30000 });
    } catch {
      // Data may not have loaded, continue anyway for diagnostics
    }
    await page.waitForTimeout(1000);
    return true;
  }

  /** Dump computed styles for a selector */
  async function dumpStyles(page: any, selector: string, label: string) {
    const info = await page.evaluate((sel: string) => {
      const el = document.querySelector(sel);
      if (!el) return { exists: false };
      const cs = window.getComputedStyle(el);
      const rect = el.getBoundingClientRect();
      return {
        exists: true,
        tagName: el.tagName,
        className: el.className,
        rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height, bottom: rect.bottom },
        styles: {
          display: cs.display,
          position: cs.position,
          zIndex: cs.zIndex,
          opacity: cs.opacity,
          overflow: cs.overflow,
          overflowY: cs.overflowY,
          background: cs.background,
          backgroundImage: cs.backgroundImage,
          pointerEvents: cs.pointerEvents,
          height: cs.height,
          width: cs.width,
        },
        scroll: {
          scrollHeight: (el as HTMLElement).scrollHeight,
          clientHeight: (el as HTMLElement).clientHeight,
          scrollTop: (el as HTMLElement).scrollTop,
          hasOverflow: (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight,
        },
        childCount: el.children.length,
      };
    }, selector);
    console.log(`\n=== ${label} (${selector}) ===`);
    console.log(JSON.stringify(info, null, 2));
    return info;
  }

  test.describe('DOM Structure Diagnostics', () => {

    test('inspect shadow overlay and scroll container', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // 1. Check .list-component__body (relative positioning context)
      const body = await dumpStyles(page,
        '.list-component__body',
        'List Component Body (relative parent)');
      expect(body.exists, '.list-component__body should exist').toBe(true);
      if (body.exists) {
        expect(body.rect.height, 'Body should have height > 0').toBeGreaterThan(0);
        expect(body.styles.position, 'Body should be relative').toBe('relative');
      }

      // 2. Check body-inner (the scroll container)
      const bodyInner = await dumpStyles(page,
        '.list-component__body-inner',
        'Body Inner (scroll container)');
      expect(bodyInner.exists, 'body-inner should exist').toBe(true);
      if (bodyInner.exists) {
        expect(bodyInner.rect.height, 'body-inner should have height > 0').toBeGreaterThan(0);
        expect(bodyInner.styles.overflowY, 'body-inner should have overflow-y: auto').toBe('auto');
        console.log(`\n>>> SCROLL STATE: scrollHeight=${bodyInner.scroll.scrollHeight}, clientHeight=${bodyInner.scroll.clientHeight}, hasOverflow=${bodyInner.scroll.hasOverflow}`);
      }

      // 3. Check the shadow overlay div (sibling of body-inner, child of body)
      const shadow = await dumpStyles(page,
        '.list-component__body > div:not(.list-component__body-inner):not(.list-component__paginator):not(.list-component__no-entries)',
        'Shadow Overlay');
      expect(shadow.exists, 'Shadow overlay div should exist').toBe(true);
      if (shadow.exists) {
        expect(shadow.rect.height, 'Shadow should have height > 0').toBeGreaterThan(0);
        expect(shadow.rect.width, 'Shadow should have width > 0').toBeGreaterThan(0);
        expect(shadow.styles.position, 'Shadow should be absolute').toBe('absolute');
        expect(shadow.styles.pointerEvents, 'Shadow should have pointer-events: none').toBe('none');
        expect(Number(shadow.styles.zIndex), 'Shadow z-index should be >= 50').toBeGreaterThanOrEqual(50);
        expect(shadow.styles.backgroundImage, 'Shadow should have a gradient background').toContain('gradient');
        expect(Number(shadow.styles.opacity), 'Shadow opacity should be 1').toBe(1);
        console.log(`\n>>> SHADOW POSITION: top=${shadow.rect.top}, bottom=${shadow.rect.bottom}, height=${shadow.rect.height}`);
      }

      // 4. Check positioning: shadow bottom should align with body-inner bottom
      if (bodyInner.exists && shadow.exists) {
        const bodyInnerBottom = bodyInner.rect.top + bodyInner.rect.height;
        const shadowBottom = shadow.rect.top + shadow.rect.height;
        console.log(`\n>>> POSITIONING: body-inner bottom=${bodyInnerBottom}, shadow bottom=${shadowBottom}`);
        expect(Math.abs(shadowBottom - bodyInnerBottom),
          `Shadow bottom (${shadowBottom}) should align with body-inner bottom (${bodyInnerBottom})`
        ).toBeLessThan(5);
      }
    });

    test('shadow is visible when content overflows', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // Check if body-inner has scrollable content
      const hasOverflow = await page.evaluate(() => {
        const el = document.querySelector('.list-component__body-inner');
        if (!el) return { found: false };
        return {
          found: true,
          scrollHeight: (el as HTMLElement).scrollHeight,
          clientHeight: (el as HTMLElement).clientHeight,
          hasOverflow: (el as HTMLElement).scrollHeight > (el as HTMLElement).clientHeight,
        };
      });

      console.log('\n>>> OVERFLOW CHECK:', JSON.stringify(hasOverflow));
      expect(hasOverflow.found, 'body-inner should exist').toBe(true);
      expect(hasOverflow.hasOverflow,
        `Content should overflow (scrollHeight=${hasOverflow.scrollHeight} vs clientHeight=${hasOverflow.clientHeight})`
      ).toBe(true);

      // Shadow should be visible (not hidden by opacity or display)
      const shadowVisible = await page.evaluate(() => {
        const body = document.querySelector('.list-component__body');
        if (!body) return { wrapperFound: false };
        const shadow = body.querySelector('div:not(.list-component__body-inner):not(.list-component__paginator):not(.list-component__no-entries):not([class*="list-component"])');
        if (!shadow) return { wrapperFound: true, shadowFound: false };
        const cs = window.getComputedStyle(shadow);
        return {
          wrapperFound: true,
          shadowFound: true,
          display: cs.display,
          visibility: cs.visibility,
          opacity: cs.opacity,
          height: cs.height,
          width: cs.width,
        };
      });

      console.log('\n>>> SHADOW VISIBILITY:', JSON.stringify(shadowVisible));
      expect(shadowVisible.shadowFound, 'Shadow element should exist').toBe(true);
      if (shadowVisible.shadowFound) {
        expect(shadowVisible.display, 'Shadow should not be display:none').not.toBe('none');
        expect(shadowVisible.visibility, 'Shadow should not be hidden').not.toBe('hidden');
        expect(Number(shadowVisible.opacity), 'Shadow opacity should be > 0').toBeGreaterThan(0);
      }
    });

    test('inspect all children of list-component__body', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      // Enumerate actual DOM children to see what's rendered
      const children = await page.evaluate(() => {
        const body = document.querySelector('.list-component__body');
        if (!body) return { found: false, children: [] };
        return {
          found: true,
          childCount: body.children.length,
          children: Array.from(body.children).map((child, i) => {
            const cs = window.getComputedStyle(child);
            const rect = child.getBoundingClientRect();
            return {
              index: i,
              tagName: child.tagName,
              className: child.className.substring(0, 120),
              rect: { top: Math.round(rect.top), height: Math.round(rect.height), bottom: Math.round(rect.bottom) },
              position: cs.position,
              display: cs.display,
              overflow: cs.overflow,
              zIndex: cs.zIndex,
              // Check grandchildren for the wrapper
              grandchildren: Array.from(child.children).map((gc, j) => {
                const gcs = window.getComputedStyle(gc);
                const grect = gc.getBoundingClientRect();
                return {
                  index: j,
                  tagName: gc.tagName,
                  className: gc.className.substring(0, 120),
                  rect: { top: Math.round(grect.top), height: Math.round(grect.height), bottom: Math.round(grect.bottom) },
                  position: gcs.position,
                  zIndex: gcs.zIndex,
                  backgroundImage: gcs.backgroundImage.substring(0, 80),
                  opacity: gcs.opacity,
                };
              }),
            };
          }),
        };
      });

      console.log('\n=== DOM TREE: .list-component__body ===');
      console.log(JSON.stringify(children, null, 2));

      expect(children.found, '.list-component__body should exist').toBe(true);
      expect(children.childCount, 'Body should have children').toBeGreaterThan(0);
    });
    test('dump raw HTML of list-component__body', async ({ authenticatedPage }) => {
      const page = authenticatedPage;
      if (!await goToAppsPage(page)) {
        test.skip('Applications page not reachable');
      }

      const html = await page.evaluate(() => {
        const el = document.querySelector('.list-component__body');
        if (!el) return 'NOT FOUND';
        // Get outer HTML but truncate child content to see structure
        const clone = el.cloneNode(true) as HTMLElement;
        // Replace deep children with placeholders
        clone.querySelectorAll('app-cards, app-table, app-paginator').forEach(child => {
          child.innerHTML = '<!-- content -->';
        });
        return clone.outerHTML;
      });

      console.log('\n=== RAW HTML: .list-component__body ===');
      console.log(html);
      expect(html).not.toBe('NOT FOUND');
      expect(html).toContain('bg-gradient-to-t');
    });
  });
});
