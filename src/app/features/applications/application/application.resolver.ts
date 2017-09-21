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

        console.log('Resolver: ')
        // const { id, cfId } = route.paramMap;
        let id = route.paramMap.get('id');
        let cfId = route.paramMap.get('cfId');
        this.applicationService.SetApplication(cfId, id)

        console.log('Resolver: id', id);
        console.log('Resolver: cfId', cfId);
        
        return true;
    }
}