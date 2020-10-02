import { Component } from '@angular/core';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  /* tslint:disable-next-line:no-inputs-metadata-property */
  inputs: ['loading']
})
export class LoaderComponent {
  // Show the loader or the content
  public loading = false;
}
