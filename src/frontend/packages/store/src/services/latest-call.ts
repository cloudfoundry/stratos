/**
 * Orders overlapping loads that write one piece of state: call begin()
 * before a request and isLatest() before writing its result. A response
 * that lands after a newer request for the same key is dropped, so an
 * older answer (a slow 1h query after a 24h one, a list fetched before a
 * delete) cannot overwrite a newer one.
 */
export class LatestCall {
  private readonly calls = new Map<string, number>();

  begin(key = ''): number {
    const call = (this.calls.get(key) ?? 0) + 1;
    this.calls.set(key, call);
    return call;
  }

  isLatest(call: number, key = ''): boolean {
    return this.calls.get(key) === call;
  }

  // Drops the result of every call in flight for the keys that match, as
  // after a change (a delete) that makes those results out of date.
  supersede(match: (key: string) => boolean): void {
    for (const key of [...this.calls.keys()]) {
      if (match(key)) {
        this.begin(key);
      }
    }
  }
}
