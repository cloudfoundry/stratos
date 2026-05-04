import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-revisions-compare',
  templateUrl: './revisions-compare.component.html',
  standalone: true,
  imports: [RouterModule],
})
export class RevisionsCompareComponent {
  private route = inject(ActivatedRoute);
  from = this.route.snapshot.queryParamMap.get('from') ?? '';
  to = this.route.snapshot.queryParamMap.get('to') ?? '';
}
