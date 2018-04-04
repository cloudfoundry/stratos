import { LocalListController } from './local-list-controller';
import { getCurrentPageStartIndex, splitClientPages } from './local-list-controller.helpers';

fdescribe('LocalListController', () => {
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
    const data = splitClientPages([
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
    expect(data).toEqual([
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
  });
});
