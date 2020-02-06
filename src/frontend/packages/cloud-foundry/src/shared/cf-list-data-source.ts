import { ListDataSource } from '../../../core/src/shared/components/list/data-sources-controllers/list-data-source';
import { QParam } from './q-param';

export abstract class CFListDataSource<T, A = T> extends ListDataSource<T, A> {
  protected setQParam(setQ: QParam, qs: QParam[]): boolean {
    const existing = qs.find((q: QParam) => q.key === setQ.key);
    let changed = true;
    if (setQ.value && setQ.value.length) {
      if (existing) {
        // Set existing value
        changed = existing.value !== setQ.value;
        existing.value = setQ.value;
      } else {
        // Add new value
        qs.push(setQ);
      }
    } else {
      if (existing) {
        // Remove existing
        qs.splice(qs.indexOf(existing), 1);
      } else {
        changed = false;
      }
    }
    return changed;
  }
}
