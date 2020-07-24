import { ActivatedRoute } from '@angular/router';

export function getParentURL(route: ActivatedRoute, removeLastParts = 1): string {
  const reducer = (a: string, v) => {
    const p = v.url.join('/');
    return p.length > 0 ? `${a}/${p}` : a;
  };
  let res = route.snapshot.pathFromRoot.reduce(reducer, '').split('/');
  res.splice(-removeLastParts, removeLastParts);
  return res.join('/');
}
