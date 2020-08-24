import { Component, OnInit, Input, Output } from '@angular/core';
import { Subject } from 'rxjs';

import { ITileConfig, ITileImgConfig } from '../../../shared/components/tile/tile-selector.types';
import { ApiEntityType } from '../../api-drive-views.types';

@Component({
  selector: 'app-api-entity-type-selector',
  templateUrl: './api-entity-type-selector.component.html',
  styleUrls: ['./api-entity-type-selector.component.scss']
})
export class ApiEntityTypeSelectorComponent implements OnInit {
  public entityTiles: ITileConfig[];
  @Input() set entityTypes(types: ApiEntityType[]) {
    this.entityTiles = types.map(type => {
      return new ITileConfig(type.title, {
        location: type.imageUrl
      }, {
          type: type.type
        }
      );
    });
  }
  @Output() public entitySelected = new Subject<ApiEntityType>();

  public emitEntitySelection(tile: ITileConfig) {
    if (tile) {
      this.entitySelected.next(
        new ApiEntityType(tile.data.type as string, tile.label as string, (tile.graphic as ITileImgConfig).location)
      );
    } else {
      this.entitySelected.next(null);
    }
  }

  constructor() { }

  ngOnInit() {
  }

}
