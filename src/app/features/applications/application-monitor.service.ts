import { ApplicationService } from './application.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';

@Injectable()
export class ApplicationMonitorService {

  appMonitor$: Observable<any>;

  constructor(
    private applicationService: ApplicationService,
  ) {
    // Do we need share()? Or should this be on the app stats observable?
    this.appMonitor$ = this.applicationService.appStatsGated$.map(item => {
      // console.log('APP MONITOR');
      // console.log(item);
      const res = {
        avg: {
          mem: 0,
          disk: 0,
          cpu: 0
        },
        max: {
          mem: 0,
          disk: 0,
          cpu: 0
        },
        running: 0,
        status: {
          instance: 'error',
          usage: 'tentative',
          disk: 'tentative',
          mem: 'tentative',
          cpu: 'tentative'
        }
      };

      if (!item.metadata) {
        return res;
      }

      const statsCount = Object.keys(item.metadata).length;
      let validStatsCount = 0;

      Object.keys(item.metadata).forEach(key => {
        const stat = item.metadata[key];
        // Inly include stats for Running Application Instances
        if (stat.stats && stat.state === 'RUNNING') {
          const usage = stat.stats.usage;
          const disk = usage.disk / stat.stats.disk_quota;
          const mem = usage.mem / stat.stats.mem_quota;
          res.avg.disk += disk;
          res.avg.mem += mem;
          res.avg.cpu += usage.cpu;
          res.max.disk = Math.max(res.max.disk, disk);
          res.max.mem = Math.max(res.max.mem, mem);
          res.max.cpu = Math.max(res.max.cpu, usage.cpu);
          validStatsCount++;
        }
        res.running += stat.state === 'RUNNING' ? 1 : 0;
      });

      // Average
      res.avg.disk = res.avg.disk / validStatsCount;
      res.avg.mem = res.avg.mem / validStatsCount;
      res.avg.cpu = res.avg.cpu / validStatsCount;

      // Mem/Disk/CPU Usage Status
      res.status.disk = this.getStatus(res.max.disk);
      res.status.mem = this.getStatus(res.max.mem);
      res.status.cpu = this.getStatus(res.max.cpu);

      // Overall Usage Status
      res.status.usage = this.getWorstStatus(res.status);

      // Instance Status
      res.status.instance = res.running === statsCount ? 'ok' : 'warning';

      return res;
    }).share();
  }

  private getStatus(value: number) {
    if (value >= 0.9) {
      return 'error';
    } else if (value >= 0.8) {
      return 'warning';
    }
    return 'ok';
  }

  private getWorstStatus(res) {
    const allStatus = Array.from(res, ([key, value]) => value);
    if (allStatus.find(status => status === 'error')) {
      return 'error';
    }
    if (allStatus.find(status => status === 'warning')) {
      return 'warning';
    }
    return 'ok';
  }

}
