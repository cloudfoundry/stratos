export interface ITileIconConfig {
  matIcon: string;
  matIconFont?: string;
}

export interface ITileImgConfig {
  location: string;
}

export type ITileGraphic = ITileIconConfig | ITileImgConfig;

export class ITileConfig<T extends ITileData = ITileData, Y = ITileGraphic> {
  constructor(
    public label: string | number,
    public graphic: Y,
    public data?: T,
    public hidden = false,
    public description = ''
  ) { }
}

export interface ITileData {
  [key: string]: string | number;
}
