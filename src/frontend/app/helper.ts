import { HttpParameterCodec } from '@angular/common/http';

export function getPath(object: { [key: string]: any }, path: string[]) {
  try {
    return path.reduce((o, i) => o[i], object);
  } catch (err) {
    return null;
  }
}


export class BrowserStandardEncoder implements HttpParameterCodec {
  encodeKey(key: string): string {
    return encodeURIComponent(key);
  }

  encodeValue(value: string): string {
    return encodeURIComponent(value);
  }

  decodeKey(key: string): string {
    return decodeURIComponent(key);
  }

  decodeValue(value: string): string {
    return decodeURIComponent(value);
  }
}
