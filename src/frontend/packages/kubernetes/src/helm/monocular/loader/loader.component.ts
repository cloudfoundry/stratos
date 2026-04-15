import { ChangeDetectionStrategy, Component, Input} from '@angular/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  standalone: true,
  imports: []
})
export class LoaderComponent {
  // Show the loader or the content
  @Input() public loading = false;
}
