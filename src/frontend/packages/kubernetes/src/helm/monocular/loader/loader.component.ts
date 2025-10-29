import { Component, Input } from '@angular/core';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  styleUrls: ['./loader.component.scss'],
  standalone: true,
  imports: [NgIf]
})
export class LoaderComponent {
  // Show the loader or the content
  @Input() public loading = false;
}
