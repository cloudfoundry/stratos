import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { ProductNameComponent } from '@stratosui/core';

@Component({
  selector: 'app-stratos-title',
  templateUrl: './stratos-title.component.html',
  styleUrls: ['./stratos-title.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ProductNameComponent
  ]
})
export class StratosTitleComponent {

  // Optional title
  @Input() title: string;
}
