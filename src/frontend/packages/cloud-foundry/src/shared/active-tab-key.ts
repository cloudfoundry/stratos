import { inject, Signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter, map, startWith } from 'rxjs/operators';

// The key of the tab a tabbed page is showing: the first segment of its
// child route's path (`variables`, or `revisions` for `revisions/:guid`),
// which is how the tab lists and the CLI command lists name a tab. Call it
// from the page's component, in an injection context.
export function activeTabKey(): Signal<string | null> {
  const route = inject(ActivatedRoute);
  const router = inject(Router);
  // routeConfig, not snapshot.routeConfig: the page is built before its first
  // child is activated, and routeConfig is already set then.
  const key = () => route.firstChild?.routeConfig?.path?.split('/')[0] ?? null;
  return toSignal(router.events.pipe(
    filter(event => event instanceof NavigationEnd),
    map(key),
    startWith(key()),
  ), { requireSync: true });
}
