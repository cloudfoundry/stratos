import { Injectable, Injector, effect, inject, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { ActivatedRouteSnapshot, ResolveFn, RouterStateSnapshot, TitleStrategy } from '@angular/router';
import { EndpointsDataService } from '@stratosui/store';

import { StratosBrandingService } from '../../theme/stratos-branding.service';

/**
 * Document title = the route's `title`, then the brand ("Create
 * application - Stratos"); the brand alone for a route without one.
 * Without it every page had the same title (SC 2.4.2). It also runs when
 * the branding changes, which sets the brand alone.
 */
@Injectable()
export class BrandedTitleStrategy extends TitleStrategy {
  private title = inject(Title);
  private injector = inject(Injector);
  private pageTitle = signal<string | undefined>(undefined);
  private watching = false;

  override updateTitle(snapshot: RouterStateSnapshot) {
    this.pageTitle.set(this.buildTitle(snapshot));
    // The Router builds this strategy, and the branding service reaches the
    // Router again (HttpClient interceptors -> snackbar -> Router), so get it
    // on the first navigation, not in the constructor (NG0200).
    if (!this.watching) {
      this.watching = true;
      const branding = this.injector.get(StratosBrandingService);
      effect(() => {
        const { displayName, companyName } = branding.theme().branding;
        const brand = displayName || companyName;
        const page = this.pageTitle();
        this.title.setTitle(page ? `${page} - ${brand}` : brand);
      }, { injector: this.injector });
    }
  }
}

/**
 * Title for a tab route: the tab's label, then the nearest ancestor title
 * ("Summary - my-app"). Ancestors resolve first, and a tab change leaves the
 * entity route's resolved title in place, so the name is there to read.
 */
export function tabTitle(label: string | ((route: ActivatedRouteSnapshot) => string)): ResolveFn<string> {
  return (route: ActivatedRouteSnapshot) => {
    const text = typeof label === 'string' ? label : label(route);
    const parent = parentTitle(route);
    return parent ? `${text} - ${parent}` : text;
  };
}

/** The nearest ancestor route's resolved title, for a resolver's fallback. */
export function parentTitle(route: ActivatedRouteSnapshot): string {
  let parent = route.parent;
  while (parent && parent.title === undefined) {
    parent = parent.parent;
  }
  return parent?.title ?? '';
}

/** Title from a route parameter ("worker-1"), optionally formatted. */
export function paramTitle(param: string, format: (value: string) => string = v => v): ResolveFn<string> {
  return (route: ActivatedRouteSnapshot) => format(route.paramMap.get(param) ?? '');
}

/**
 * Title for an endpoint page: the endpoint's name from the store (one
 * hydration fetch at most). An unknown guid keeps the section's title.
 */
export function endpointTitle(param = 'endpointId'): ResolveFn<string> {
  return (route: ActivatedRouteSnapshot) => {
    const endpoints = inject(EndpointsDataService);
    return endpoints.waitFor(route.paramMap.get(param) ?? '').then(e => e.name, () => parentTitle(route));
  };
}
