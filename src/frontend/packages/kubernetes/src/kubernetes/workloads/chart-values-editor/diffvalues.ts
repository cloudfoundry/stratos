// Helper for diffing user values and chart values

function arraysAreEqual(a1: unknown[], a2: unknown[]): boolean {
  if (a1.length !== a2.length) {
    return false;
  }

  // Compare each item in the array
  for (let i = 0; i < a1.length; i++) {
    if (Array.isArray(a1[i])) {
      if (!arraysAreEqual(a1[i] as unknown[], a2[i] as unknown[])) {
        return false;
      }
    } else if (typeof a1[i] === 'object') {
      if (!objectsAreEqual(a1[i] as Record<string, unknown>, a2[i] as Record<string, unknown>)) {
        return false;
      }
    } else if (a1[i] !== a2[i]) {
      return false;
    }
  }
  return true;
}

function objectsAreEqual(src: Record<string, unknown>, dest: Record<string, unknown>): boolean {
  if (Object.keys(src).length !== Object.keys(dest).length) {
    return false;
  }

  for (const key of Object.keys(src)) {
    if (typeof (src[key]) !== typeof (dest[key])) {
      return false;
    } else if (src[key] === null && dest[key] === null) {
      return true;
    } else if (Array.isArray(src[key]) && !arraysAreEqual(src[key] as unknown[], dest[key] as unknown[])) {
      return false;
    } else if (typeof (src[key]) === 'object' && !objectsAreEqual(src[key] as Record<string, unknown>, dest[key] as Record<string, unknown>)) {
      return false;
    }
  }

  return true;
}

// NOTE: This is a one-way diff only
// diffObjects is main export - diffs two objects and returns only the diffrence
export function diffObjects(src: Record<string, unknown>, dest: Record<string, unknown>): Record<string, unknown> {
  if (!src) {
    return {};
  }

  Object.keys(src).forEach(key => {
    if (typeof (src[key]) === typeof (dest[key])) {
      if (src[key] === null && dest[key] === null) {
        delete src[key];
      } else if (Array.isArray(src[key])) {
        // Array
        if (arraysAreEqual(src[key] as unknown[], dest[key] as unknown[])) {
          delete src[key];
        }
      } else if (typeof (src[key]) === 'object') {
        // Object
        diffObjects(src[key] as Record<string, unknown>, dest[key] as Record<string, unknown>);
        if (src[key] && Object.keys(src[key] as Record<string, unknown>).length === 0) {
          delete src[key];
        }
      } else if (src[key] === dest[key]) {
        // Value
        delete src[key];
      }
    }
  });
  return src;
}
