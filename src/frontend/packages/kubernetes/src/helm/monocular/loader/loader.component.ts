import { ChangeDetectionStrategy, Component, Input} from '@angular/core';
import { AppSpinnerComponent } from '@stratosui/core';


@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-loader',
  templateUrl: './loader.component.html',
  standalone: true,
  imports: [AppSpinnerComponent]
})
export class LoaderComponent {
  // Show the loader or the content
  @Input() public loading = false;
}
