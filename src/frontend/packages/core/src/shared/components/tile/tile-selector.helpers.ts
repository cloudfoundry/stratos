import { ITileConfig, ITileData, ITileGraphic } from './tile-selector.types';
/**
 * deprecated
 */
export class TileConfigManager {
  public getNextTileConfig<T extends ITileData = ITileData>(
    label: string,
    graphic: ITileGraphic,
    data: T
  ) {
    return new ITileConfig<T>(
      label,
      graphic,
      data
    );
  }
}
