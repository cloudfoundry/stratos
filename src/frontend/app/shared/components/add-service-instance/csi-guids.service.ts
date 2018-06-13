import { Injectable } from '@angular/core';
import { StringifyOptions } from 'querystring';

@Injectable()
export class CsiGuidsService {

  public cfGuid: string;
  public serviceGuid: string;
  constructor() { }

}
