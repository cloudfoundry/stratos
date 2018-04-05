export function splitCurrentPage<T = any>(entities: (T | T[])[], pageSize: number, currentPage: number) {
  if (!entities || !entities.length) {
    return {
      entities: [],
      index: 0
    };
  }
  const index = getCurrentPageStartIndex(entities, pageSize, currentPage);
  if (Array.isArray(entities[index])) {
    return {
      entities,
      index
    };
  }
  const pages = [...entities];
  if (index + pageSize > pages.length) {
    pageSize = pages.length - index;
  }
  const page = pages.splice(index, pageSize) as T[];
  pages.splice(index, 0, page);
  return {
    entities: pages,
    index
  };
}

export function getCurrentPageStartIndex<T = any>(entities: (T | T[])[], pageSize: number, requiredPage: number) {
  const data = {
    index: 0,
    currentPage: 0,
    splitPages: 0
  };
  for (let i = 0; i < entities.length; i++) {
    const ent = entities[i];
    data.index = i;
    if (Array.isArray(ent)) {
      ++data.currentPage;
      ++data.splitPages;
    } else {
      const index = (i - data.splitPages) + (data.splitPages * pageSize);
      const remainder = index % pageSize;
      if (remainder === 0) {
        ++data.currentPage;
      }
    }
    if (data.currentPage === requiredPage) {
      break;
    }
  }
  return data.index;
}
