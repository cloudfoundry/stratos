import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { ApplicationService } from '../application.service';

@Injectable()
export class ApplicationResolver implements Resolve<boolean> {

    constructor(private route: ActivatedRoute, private applicationService: ApplicationService) { }

    resolve(
        route: ActivatedRouteSnapshot,
        state: RouterStateSnapshot
    ): boolean {
        this.applicationService.setApplication(route.paramMap.get('cfId'), route.paramMap.get('id'));
        return true;
    }
}
