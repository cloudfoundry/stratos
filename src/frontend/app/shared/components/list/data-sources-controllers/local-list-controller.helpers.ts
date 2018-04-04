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
  console.log('splitttting', currentPage);
  const pages = [...entities];

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
  // const actualStartIndex = entities.reduce((data, ent, i) => {
  //   // console.log(index, ent, i);
  //   if (Array.isArray(ent)) {
  //     ++data.index;
  //     ++data.arrayCount;
  //     return data;
  //   }
  //   console.log(data.arrayCount);
  //   console.log('currentPage', (i - data.arrayCount) + 1);
  //   console.log(currentPage);
  //   console.log(((i - data.arrayCount) + 1) === currentPage);
  //   if ((i + 1) % pageSize > 0 || ((i - data.arrayCount) + 1) <= currentPage) {
  //     return data;
  //   }
  //   data.index += pageSize;
  //   console.log('index', data.index);
  //   return data;
  // }, {
  //     index: 0,
  //     arrayCount: 0
  //   });
}
