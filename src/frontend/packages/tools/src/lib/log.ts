let logLevel = 1;

export function setLogLevel(level: number) {
  logLevel = level;
}

export function debug(msg) {
  if (logLevel > 0) {
    console.log(msg);
  }
}


