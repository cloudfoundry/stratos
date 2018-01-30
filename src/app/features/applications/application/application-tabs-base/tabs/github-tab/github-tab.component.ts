import { Component, OnInit } from '@angular/core';
import { ApplicationService } from '../../../../application.service';
import { tap } from 'rxjs/operators';
import { EnvVarStratosProject } from '../build-tab/application-env-vars.service';

@Component({
  selector: 'app-github-tab',
  templateUrl: './github-tab.component.html',
  styleUrls: ['./github-tab.component.scss']
})
export class GithubTabComponent implements OnInit {

  stratosProject: EnvVarStratosProject;

  constructor(private applicationService: ApplicationService) { }

  ngOnInit() {

    this.applicationService.application$.pipe(
      tap(p => {
        this.stratosProject = JSON.parse(p.app.entity.environment_json.STRATOS_PROJECT);
      }),
      tap(p => {
        console.log(this.stratosProject)
      })
    ).subscribe();

  }

}
