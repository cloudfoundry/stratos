import { getCurrentPageStartIndex, splitCurrentPage } from './local-list-controller.helpers';

describe('LocalListController', () => {
  const page = [
    [1,
      2],
    3,
    4,
    [5, 6],
    8,
    9,
    10,
    11
  ];

  it('should get correct start index 1', () => {
    const start = getCurrentPageStartIndex(page, 2, 4);
    expect(start).toBe(4);
  });

  it('should get correct start index 2', () => {
    const start = getCurrentPageStartIndex([
      0,
      1,
      3,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
      7,
      8
    ], 3, 4);
    expect(start).toBe(9);
  });

  it('should get correct start index 3', () => {
    const start = getCurrentPageStartIndex([
      [0,
        1,
        3],
      [2,
        3,
        3],
      4,
      5,
      5,
      [6,
        7,
        8]
    ], 3, 3);
    expect(start).toBe(2);
  });

  it('should get correct start index 4', () => {
    const start = getCurrentPageStartIndex([
      [0,
        1,
        3],
      [2,
        3,
        3],
      [4,
        5,
        5],
      [6,
        7,
        8]
    ], 3, 3);
    expect(start).toBe(2);
  });

  it('should get split pages', () => {
    const data = splitCurrentPage([
      [0,
        1,
        3],
      2,
      3,
      3,
      [4,
        5,
        5],
      [6,
        7,
        8]
    ], 3, 2);
    expect(data.entities).toEqual([
      [0,
        1,
        3],
      [2,
        3,
        3],
      [4,
        5,
        5],
      [6,
        7,
        8]
    ]);
    expect(data.index).toEqual(1);
  });

  it('should get split pages 1', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      2,
      3,
      3,
      [4,
        5,
        5],
      6,
      7,
      8
    ], 3, 4);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      2,
      3,
      3,
      [4,
        5,
        5],
      [6,
        7,
        8]
    ]);
    expect(data.index).toEqual(7);
  });

  it('should get split pages 2', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      2,
      3,
      3,
      4,
      5,
      5,
      6,
      7,
      8
    ], 5, 2);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      2,
      3,
      [3,
        4,
        5,
        5,
        6],
      7,
      8
    ]);
    expect(data.index).toEqual(5);
  });

  it('should get split pages 3', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      [2,
        3,
        3,
        4,
        5],
      5,
      6
    ], 5, 3);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      [2,
        3,
        3,
        4,
        5],
      [5,
        6]
    ]);
    expect(data.index).toEqual(6);
  });
  it('should get split pages 4', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6
    ], 5, 3);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      [5,
        6]
    ]);
    expect(data.index).toEqual(10);
  });
  it('should get split pages 5', () => {
    const data = splitCurrentPage([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6
    ], 5, 4);
    expect(data.entities).toEqual([
      0,
      1,
      3,
      5,
      6,
      2,
      3,
      3,
      4,
      5,
      5,
      6
    ]);
    expect(data.index).toEqual(null);
  });
});
