export function splitCurrentPage<T = any>(entities: (T | T[])[], pageSize: number, currentPage: number) {
  if (!entities || !entities.length) {
    return {
      entities: [],
      index: 0
    };
  }
  // Sentinel values (negative) or zero: return all items as a single page
  if (pageSize <= 0) {
    return {
      entities: [entities as unknown as T[]],
      index: 0
    };
  }
  // Flatten any previously split pages to get a clean entity list
  const flat = entities.flat(Infinity) as T[];
  const start = (currentPage - 1) * pageSize;
  const page = flat.slice(start, start + pageSize);
  return {
    entities: [page],
    index: 0
  };
}

export function getCurrentPageStartIndex<T = any>(entities: (T | T[])[], pageSize: number, requiredPage: number): number | null {
  const data = {
    index: null as number | null,
    currentPage: 0,
    splitPages: 0
  };
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    if (Array.isArray(ent)) {
      ++data.currentPage;
      ++data.splitPages;
    } else {
      const index = (i - data.splitPages) + (data.splitPages * pageSize);
      if (index % pageSize === 0) {
        ++data.currentPage;
      }
    }
    if (data.currentPage === requiredPage) {
      data.index = i;
      break;
    }
  }
  return data.index;
}
