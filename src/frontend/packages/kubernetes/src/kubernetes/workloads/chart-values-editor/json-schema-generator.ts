// Generate a JSON Schema from an object
// This code incorporates the library: https://github.com/nijikokun/generate-schema/blob/master/src/schemas/json.js
// It is modified for Typescript and to mark all properties as not required

// Reference: https://github.com/stephenhandley/type-of-is/blob/master/index.js
// Modified for Typescript

const BUILT_IN_TYPES = [
  Object,
  Function,
  Array,
  String,
  Boolean,
  Number,
  Date,
  RegExp,
  Error
];

const toString = ({}).toString;

function isBuiltIn(constructor: new (...args: any[]) => any): boolean {
  for (const bit of BUILT_IN_TYPES) {
    if (bit === constructor) {
      return true;
    }
  }
  return false;
}

function of(obj: unknown): (new (...args: any[]) => any) | null | undefined {
  if ((obj === null) || (obj === undefined)) {
    return obj as null | undefined;
  } else {
    return (obj as any).constructor as (new (...args: any[]) => any);
  }
}

function stringType(obj: unknown): string {
  // [object Blah] -> Blah
  const stype = toString.call(obj).slice(8, -1);
  if ((obj === null) || (obj === undefined)) {
    return stype.toLowerCase();
  }

  const ctype = of(obj);
  if (ctype && !isBuiltIn(ctype)) {
    return ctype.name;
  } else {
    return stype;
  }
}

// Reference: https://github.com/nijikokun/generate-schema/blob/master/src/schemas/json.js


const DRAFT = 'http://json-schema.org/draft-04/schema#';

function getPropertyFormat(value: unknown): string | null {
  const type = stringType(value).toLowerCase();

  if (type === 'date') { return 'date-time'; }
  return null;
}

function getPropertyType(value: unknown): string {
  const type = stringType(value).toLowerCase();

  if (type === 'number') { return Number.isInteger(value) ? 'integer' : type; }
  if (type === 'date') { return 'string'; }
  if (type === 'regexp') { return 'string'; }
  if (type === 'function') { return 'string'; }
  return type;
}

function processArray(array: unknown[], output?: Record<string, unknown>, nested?: boolean): Record<string, unknown> {
  let format: string | null = null;
  let oneOf: boolean | undefined;
  let type: string | null = null;

  if (nested && output) {
    output = { items: output };
  } else {
    output = output || {};
    output.type = getPropertyType(array);
    output.items = output.items || {};
    type = (output.items as any).type || null;
  }

  // Determine whether each item is different
  for (let arrIndex = 0, arrLength = array.length; arrIndex < arrLength; arrIndex++) {
    const elementType = getPropertyType(array[arrIndex]);
    const elementFormat = getPropertyFormat(array[arrIndex]);

    if (type && elementType !== type) {
      (output.items as any).oneOf = [];
      oneOf = true;
      break;
    } else {
      type = elementType;
      format = elementFormat;
    }
  }

  // Setup type otherwise
  if (!oneOf && type) {
    (output.items as any).type = type;
    if (format) {
      (output.items as any).format = format;
    }
  } else if (oneOf && type !== 'object') {
    output.items = {
      oneOf: [{ type }],
      required: false
    };
  }

  // Process each item depending
  if (typeof (output.items as any).oneOf !== 'undefined' || type === 'object') {
    for (let itemIndex = 0, itemLength = array.length; itemIndex < itemLength; itemIndex++) {
      const value = array[itemIndex];
      const itemType = getPropertyType(value);
      const itemFormat = getPropertyFormat(value);
      let arrayItem: Record<string, unknown>;
      if (itemType === 'object') {
        if ((output.items as any).properties) {
          (output.items as any).required = false;
        }
        arrayItem = processObject(value as Record<string, unknown>, oneOf ? {} : (output.items as any).properties, true);
      } else if (itemType === 'array') {
        arrayItem = processArray(value as unknown[], oneOf ? {} : (output.items as any).properties, true);
      } else {
        arrayItem = {};
        arrayItem.type = itemType;
        if (itemFormat) {
          arrayItem.format = itemFormat;
        }
      }
      if (oneOf) {
        const childType = stringType(value).toLowerCase();
        const tempObj: any = {};
        if (!arrayItem.type && childType === 'object') {
          tempObj.properties = arrayItem;
          tempObj.type = 'object';
          arrayItem = tempObj;
        }
        (output.items as any).oneOf.push(arrayItem);
      } else {
        if ((output.items as any).type !== 'object') {
          continue;
        }
        (output.items as any).properties = arrayItem;
      }
    }
  }
  return nested ? (output.items as Record<string, unknown>) : output;
}

function processObject(object: Record<string, unknown>, output?: Record<string, unknown>, nested?: boolean): Record<string, unknown> {
  if (nested && output) {
    output = { properties: output };
  } else {
    output = output || {};
    output.type = getPropertyType(object);
    output.properties = output.properties || {};
    output.required = [];
  }

  for (const key of Object.keys(object)) {
    const value = object[key];
    let typ = getPropertyType(value);
    const format = getPropertyFormat(value);

    typ = typ === 'undefined' ? 'null' : typ;

    if (typ === 'object') {
      (output.properties as any)[key] = processObject(value as Record<string, unknown>, (output.properties as any)[key]);
      continue;
    }

    if (typ === 'array') {
      (output.properties as any)[key] = processArray(value as unknown[], (output.properties as any)[key]);
      continue;
    }

    if ((output.properties as any)[key]) {
      const entry = (output.properties as any)[key];
      const hasTypeArray = Array.isArray(entry.type);

      // When an array already exists, we check the existing
      // type array to see if it contains our current property
      // type, if not, we add it to the array and continue
      if (hasTypeArray && entry.type.indexOf(typ) < 0) {
        entry.type.push(typ);
      }

      // When multiple fields of differing types occur,
      // json schema states that the field must specify the
      // primitive types the field allows in array format.
      if (!hasTypeArray && entry.type !== typ) {
        entry.type = [entry.type, typ];
      }

      continue;
    }

    (output.properties as any)[key] = {};
    (output.properties as any)[key].type = typ;

    if (format) {
      (output.properties as any)[key].format = format;
    }
  }

  return nested ? (output.properties as Record<string, unknown>) : output;
}


export function generateJsonSchemaFromObject(title: string | undefined, object: unknown): Record<string, unknown> {
  let processOutput: Record<string, unknown> | undefined;
  const output: Record<string, unknown> = {
    $schema: DRAFT
  };

  // Determine title exists
  if (typeof title !== 'string') {
    object = title;
    title = undefined;
  } else {
    output.title = title;
  }

  // Set initial object type
  output.type = stringType(object).toLowerCase();

  // Process object
  if (output.type === 'object') {
    processOutput = processObject(object as Record<string, unknown>);
    output.type = processOutput.type;
    output.properties = processOutput.properties;

    // For a generated schema, nothing is marked as required
    // This is a modification to the library
    output.required = false;
  }

  if (output.type === 'array') {
    processOutput = processArray(object as unknown[]);
    output.type = processOutput.type;
    output.items = processOutput.items;

    if (output.title) {
      (output.items as any).title = output.title;
      output.title += ' Set';
    }
  }

  // Output
  return output;
}
