import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PageHeaderService {

  constructor() { }

  headerActive: boolean = false;

}
