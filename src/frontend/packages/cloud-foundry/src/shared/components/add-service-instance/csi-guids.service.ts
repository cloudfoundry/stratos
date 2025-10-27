import { Injectable } from '@angular/core';
// import { StringifyOptions } from 'querystring';

@Injectable({
  providedIn: 'root'
})
export class CsiGuidsService {

  public cfGuid: string;
  public serviceGuid: string;
  constructor() { }

}
