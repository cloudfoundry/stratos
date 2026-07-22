let logLevel = 1;

export interface Logger {
  log(msg: string): void;
}

export function setLogLevel(level: number) {
  logLevel = level;
}

export function debug(msg: any) {
  if (logLevel > 0) {
    console.log(msg);
  }
}


