import { ITileConfig, ITileData, ITileIconConfig } from './tile-selector.types';

export class TileConfigManager {
  private nextIndex = 0;
  private getIndex() {
    const index = this.nextIndex;
    this.nextIndex++;
    return index;
  }
  public getNextTileConfig<T extends ITileData = ITileData>(
    label: string,
    iconConfig: ITileIconConfig,
    data: T
  ) {
    return new ITileConfig<T>(
      this.getIndex(),
      label,
      iconConfig,
      data
    );
  }
}
