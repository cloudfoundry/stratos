export class ITileConfig<T extends ITileData = ITileData> {
  constructor(
    readonly key: number,
    public label: string | number,
    public data: T,
  ) { }
}

export interface ITileData {
  [key: string]: string | number;
}
