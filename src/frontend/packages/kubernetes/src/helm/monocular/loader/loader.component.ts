import { Component, Input } from '@angular/core';


@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone: true,
  imports: []
})
export class LoaderComponent {
  // Show the loader or the content
  @Input() public loading = false;
}
