import { ChangeDetectionStrategy, Component  } from '@angular/core';

@Component({
  selector: 'app-intro-screen',
  templateUrl: './intro-screen.component.html',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class IntroScreenComponent { }
