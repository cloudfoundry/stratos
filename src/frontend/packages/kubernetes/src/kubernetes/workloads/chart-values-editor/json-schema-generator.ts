// Generate a JSON Schema from an object
// This code incorporates the library: https://github.com/nijikokun/generate-schema/blob/master/src/schemas/json.js
// It is modified for Typescript and to mark all properties as not required

// Reference: https://github.com/stephenhandley/type-of-is/blob/master/index.js
// Modified for Typescript

// Type definitions for JSON Schema structures
interface JsonSchemaProperty {
  type?: string | string[];
  format?: string;
  items?: JsonSchemaProperty;
  properties?: Record<string, JsonSchemaProperty>;
  oneOf?: JsonSchemaProperty[];
  required?: boolean | string[];
  title?: string;
}

// Type for constructor functions
type Constructor = new (...args: unknown[]) => unknown;

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

const objectToString = ({}).toString;

function isBuiltIn(ctor: Function): boolean {
  for (const bit of BUILT_IN_TYPES) {
    if (bit === ctor) {
      return true;
    }
  }
  return false;
}

function of(obj: unknown): Constructor | null | undefined {
  if ((obj === null) || (obj === undefined)) {
    return obj as null | undefined;
  } else {
    return (obj as Record<string, unknown>).constructor as Constructor;
  }
}

function stringType(obj: unknown): string {
  // [object Blah] -> Blah
  const stype = objectToString.call(obj).slice(8, -1);
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

function _getUniqueKeys(a: Record<string, unknown>, b: Record<string, unknown>, c?: string[]): string[] {
  const aKeys = Object.keys(a);
  const bKeys = Object.keys(b);
  const result = c || [];

  let value: string;
  let cIndex: number;
  let aIndex: number;

  for (let keyIndex = 0, keyLength = bKeys.length; keyIndex < keyLength; keyIndex++) {
    value = bKeys[keyIndex];
    aIndex = aKeys.indexOf(value);
    cIndex = result.indexOf(value);

    if (aIndex === -1) {
      if (cIndex !== -1) {
        // Value is optional, it doesn't exist in A but exists in B(n)
        result.splice(cIndex, 1);
      }
    } else if (cIndex === -1) {
      // Value is required, it exists in both B and A, and is not yet present in C
      result.push(value);
    }
  }

  return result;
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
    const items = output.items as JsonSchemaProperty;
    type = items.type as string || null;
  }

  // Determine whether each item is different
  for (let arrIndex = 0, arrLength = array.length; arrIndex < arrLength; arrIndex++) {
    const elementType = getPropertyType(array[arrIndex]);
    const elementFormat = getPropertyFormat(array[arrIndex]);

    if (type && elementType !== type) {
      const items = output.items as JsonSchemaProperty;
      items.oneOf = [];
      oneOf = true;
      break;
    } else {
      type = elementType;
      format = elementFormat;
    }
  }

  // Setup type otherwise
  if (!oneOf && type) {
    const items = output.items as JsonSchemaProperty;
    items.type = type;
    if (format) {
      items.format = format;
    }
  } else if (oneOf && type !== 'object') {
    output.items = {
      oneOf: [{ type }],
      required: false
    };
  }

  // Process each item depending
  const items = output.items as JsonSchemaProperty;
  if (typeof items.oneOf !== 'undefined' || type === 'object') {
    for (let itemIndex = 0, itemLength = array.length; itemIndex < itemLength; itemIndex++) {
      const value = array[itemIndex];
      const itemType = getPropertyType(value);
      const itemFormat = getPropertyFormat(value);
      let arrayItem: Record<string, unknown>;
      if (itemType === 'object') {
        if (items.properties) {
          items.required = false;
        }
        arrayItem = processObject(value as Record<string, unknown>, oneOf ? {} : items.properties, true);
      } else if (itemType === 'array') {
        arrayItem = processArray(value as unknown[], oneOf ? {} : items.properties, true);
      } else {
        arrayItem = {};
        arrayItem.type = itemType;
        if (itemFormat) {
          arrayItem.format = itemFormat;
        }
      }
      if (oneOf) {
        const childType = stringType(value).toLowerCase();
        const tempObj: Record<string, unknown> = {};
        if (!arrayItem.type && childType === 'object') {
          tempObj.properties = arrayItem;
          tempObj.type = 'object';
          arrayItem = tempObj;
        }
        if (items.oneOf) {
          items.oneOf.push(arrayItem as JsonSchemaProperty);
        }
      } else {
        if (items.type !== 'object') {
          continue;
        }
        items.properties = arrayItem as Record<string, JsonSchemaProperty>;
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

  const properties = output.properties as Record<string, JsonSchemaProperty>;

  for (const key of Object.keys(object)) {
    const value = object[key];
    let typ = getPropertyType(value);
    const format = getPropertyFormat(value);

    typ = typ === 'undefined' ? 'null' : typ;

    if (typ === 'object') {
      properties[key] = processObject(value as Record<string, unknown>, properties[key] as Record<string, unknown>) as JsonSchemaProperty;
      continue;
    }

    if (typ === 'array') {
      properties[key] = processArray(value as unknown[], properties[key] as Record<string, unknown>) as JsonSchemaProperty;
      continue;
    }

    if (properties[key]) {
      const entry = properties[key];
      const hasTypeArray = Array.isArray(entry.type);

      // When an array already exists, we check the existing
      // type array to see if it contains our current property
      // type, if not, we add it to the array and continue
      if (hasTypeArray && (entry.type as string[]).indexOf(typ) < 0) {
        (entry.type as string[]).push(typ);
      }

      // When multiple fields of differing types occur,
      // json schema states that the field must specify the
      // primitive types the field allows in array format.
      if (!hasTypeArray && entry.type !== typ) {
        entry.type = [entry.type as string, typ];
      }

      continue;
    }

    properties[key] = { type: typ };

    if (format) {
      properties[key].format = format;
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
      const items = output.items as JsonSchemaProperty;
      items.title = output.title as string;
      output.title += ' Set';
    }
  }

  // Output
  return output;
}
