
import { share, map } from 'rxjs/operators';
import { ApplicationService } from './application.service';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

export class AppMonitorState {

  avg = {
    mem: 0,
    disk: 0,
    cpu: 0,
    uptime: 0,
  };
  max = {
    mem: 0,
    disk: 0,
    cpu: 0,
    uptime: 0,
  };
  min = {
    uptime: Number.MAX_SAFE_INTEGER,
  };
  running = 0;
  status = {
    instance: 'error',
    usage: 'tentative',
    disk: 'tentative',
    mem: 'tentative',
    cpu: 'tentative',
  };

  constructor() { }

  updateStatuses() {
    // Mem/Disk/CPU Usage Status
    this.status.disk = this.getStatus(this.max.disk);
    this.status.mem = this.getStatus(this.max.mem);
    this.status.cpu = this.getStatus(this.max.cpu);

    // Overall Usage Status
    this.status.usage = this.getWorstStatus(this.status.mem, this.status.disk, this.status.cpu);
  }

  private getStatus(value: number) {
    if (value >= 0.9) {
      return 'error';
    } else if (value >= 0.8) {
      return 'warning';
    }
    return 'ok';
  }

  private getWorstStatus(...statuses: string[]): string {
    if (statuses.find(status => status === 'error')) {
      return 'error';
    }
    if (statuses.find(status => status === 'warning')) {
      return 'warning';
    }
    return 'ok';
  }
}

@Injectable()
export class ApplicationMonitorService {

  appMonitor$: Observable<AppMonitorState>;

  constructor(
    private applicationService: ApplicationService,
  ) {
    // Do we need share()? Or should this be on the app stats observable?
    this.appMonitor$ = this.applicationService.appStats$.pipe(map(stats => {
      const res = new AppMonitorState();
      if (!stats) {
        return res;
      }

      const statsCount = stats.length;
      let validStatsCount = 0;

      stats.forEach(stat => {
        // Inly include stats for Running Application Instances
        if (stat.stats && stat.state === 'RUNNING') {
          const usage = stat.stats.usage;
          const disk = usage.disk / stat.stats.disk_quota;
          const mem = usage.mem / stat.stats.mem_quota;
          res.avg.disk += disk;
          res.avg.mem += mem;
          res.avg.cpu += usage.cpu;
          res.avg.uptime += stat.stats.uptime;
          res.max.disk = Math.max(res.max.disk, disk);
          res.max.mem = Math.max(res.max.mem, mem);
          res.max.cpu = Math.max(res.max.cpu, usage.cpu);
          res.max.uptime = Math.max(res.max.uptime, stat.stats.uptime);
          res.min.uptime = Math.min(res.min.uptime, stat.stats.uptime);
          validStatsCount++;
        }
        res.running += stat.state === 'RUNNING' ? 1 : 0;
      });

      // Average
      res.avg.disk = this.roundFourPlaces(res.avg.disk / validStatsCount);
      res.avg.mem = this.roundFourPlaces(res.avg.mem / validStatsCount);
      res.avg.cpu = this.roundFourPlaces(res.avg.cpu / validStatsCount);
      res.avg.uptime = Math.round(res.avg.uptime / validStatsCount);

      res.updateStatuses();

      // Instance Status
      res.status.instance = res.running === statsCount ? 'ok' : 'warning';

      return res;
    }), share());
  }

  roundFourPlaces(num: number): number {
    return Math.round(num * 10000) / 10000;
  }
}
