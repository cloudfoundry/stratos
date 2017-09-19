import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, Resolve, RouterStateSnapshot, ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs/Observable';
import { Store } from '@ngrx/store';
import { AppState } from '../../store/app-state';
import { getEntity } from '../../store/actions/api.actions';
import { GetApplication, ApplicationSchema } from '../../store/actions/application.actions';
import { ApplicationService } from '../../services/application.service';
// import { Todo } from './todo';
// import { TodoDataService } from './todo-data.service';

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

        //TODO: RC? What to do for application not found or other core api error??
        // return getEntity(
        //     this.store,
        //     ApplicationSchema.key,
        //     ApplicationSchema,
        //     id,
        //     new GetApplication(id, cfId)
        // ).first();
        // return Observable.of({});
        // a.subscribe(() => {})
        // console.log('Resolver: a', a);
        // return a;
    }
}