import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class StyleService {

  private rules: string[] = [];
  constructor() {
    this.rules = this.getAllSelectors();
  }

  hasSelector = (selector) => {
    return !!this.rules.find(ruleSelector => ruleSelector === selector);
  }

  private getAllSelectors = (): string[] => {
    const ret = [];
    // tslint:disable-next-line:prefer-for-of
    for (let i = 0; i < document.styleSheets.length; i++) {
      const styleSheet = document.styleSheets[i];
      if (!(styleSheet instanceof CSSStyleSheet)) {
        continue;
      }
      try {
        // Accessing rules on cross-origin stylesheets throws SecurityError
        // This includes localhost/127.0.0.1 with different ports or protocols
        const rules = styleSheet.rules || styleSheet.cssRules;
        // tslint:disable-next-line:prefer-for-of
        for (let y = 0; y < rules.length; y++) {
          const rule = rules[y];
          if (!(rule instanceof CSSStyleRule)) {
            continue;
          }
          if (typeof rule.selectorText === 'string') { ret.push(rule.selectorText); }
        }
      } catch (e) {
        // Silently skip cross-origin stylesheets that throw SecurityError
        // Expected in dev mode with proxy (different ports/protocols)
        continue;
      }
    }
    return ret;
  }

}
