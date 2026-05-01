import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-revision-detail',
  templateUrl: './revision-detail.component.html',
  standalone: false,
})
export class RevisionDetailComponent {
  revisionGuid = inject(ActivatedRoute).snapshot.paramMap.get('revisionGuid') ?? '';
}
