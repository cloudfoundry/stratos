import { Injectable } from '@angular/core';

@Injectable()
export class ActiveRouteCfOrgSpace {
  cfGuid: string;
  orgGuid: string;
  spaceGuid: string;
}

@Injectable()
export class ActiveRouteCfCell {
  cfGuid: string;
  cellId: string;
}
