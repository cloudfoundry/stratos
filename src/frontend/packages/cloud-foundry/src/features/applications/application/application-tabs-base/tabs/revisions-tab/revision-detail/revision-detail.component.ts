import { Component, inject, ChangeDetectionStrategy } from "@angular/core";
import { ActivatedRoute, RouterModule } from "@angular/router";

@Component({
  selector: "app-revision-detail",
  templateUrl: "./revision-detail.component.html",
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterModule],
})
export class RevisionDetailComponent {
  revisionGuid =
    inject(ActivatedRoute).snapshot.paramMap.get("revisionGuid") ?? "";
}
