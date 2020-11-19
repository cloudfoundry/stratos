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

function isBuiltIn(constructor): boolean {
  for (const bit of BUILT_IN_TYPES) {
    if (bit === constructor) {
      return true;
    }
  }
  return false;
}

function of(obj) {
  if ((obj === null) || (obj === undefined)) {
    return obj;
  } else {
    return obj.constructor;
  }
}

function stringType(obj) {
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

function getPropertyFormat(value) {
  const type = stringType(value).toLowerCase();

  if (type === 'date') { return 'date-time'; }
  return null;
}

function getPropertyType(value) {
  const type = stringType(value).toLowerCase();

  if (type === 'number') { return Number.isInteger(value) ? 'integer' : type; }
  if (type === 'date') { return 'string'; }
  if (type === 'regexp') { return 'string'; }
  if (type === 'function') { return 'string'; }
  return type;
}

function getUniqueKeys(a, b, c) {
  a = Object.keys(a);
  b = Object.keys(b);
  c = c || [];

  let value;
  let cIndex;
  let aIndex;

  for (let keyIndex = 0, keyLength = b.length; keyIndex < keyLength; keyIndex++) {
    value = b[keyIndex];
    aIndex = a.indexOf(value);
    cIndex = c.indexOf(value);

    if (aIndex === -1) {
      if (cIndex !== -1) {
        // Value is optional, it doesn't exist in A but exists in B(n)
        c.splice(cIndex, 1);
      }
    } else if (cIndex === -1) {
      // Value is required, it exists in both B and A, and is not yet present in C
      c.push(value);
    }
  }

  return c;
}

function processArray(array, output?, nested?: boolean) {
  let format;
  let oneOf;
  let type;

  if (nested && output) {
    output = { items: output };
  } else {
    output = output || {};
    output.type = getPropertyType(array);
    output.items = output.items || {};
    type = output.items.type || null;
  }

  // Determine whether each item is different
  for (let arrIndex = 0, arrLength = array.length; arrIndex < arrLength; arrIndex++) {
    const elementType = getPropertyType(array[arrIndex]);
    const elementFormat = getPropertyFormat(array[arrIndex]);

    if (type && elementType !== type) {
      output.items.oneOf = [];
      oneOf = true;
      break;
    } else {
      type = elementType;
      format = elementFormat;
    }
  }

  // Setup type otherwise
  if (!oneOf && type) {
    output.items.type = type;
    if (format) {
      output.items.format = format;
    }
  } else if (oneOf && type !== 'object') {
    output.items = {
      oneOf: [{ type }],
      required: false
    };
  }

  // Process each item depending
  if (typeof output.items.oneOf !== 'undefined' || type === 'object') {
    for (let itemIndex = 0, itemLength = array.length; itemIndex < itemLength; itemIndex++) {
      const value = array[itemIndex];
      const itemType = getPropertyType(value);
      const itemFormat = getPropertyFormat(value);
      let arrayItem;
      if (itemType === 'object') {
        if (output.items.properties) {
          output.items.required = false;
        }
        arrayItem = processObject(value, oneOf ? {} : output.items.properties, true);
      } else if (itemType === 'array') {
        arrayItem = processArray(value, oneOf ? {} : output.items.properties, true);
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
        output.items.oneOf.push(arrayItem);
      } else {
        if (output.items.type !== 'object') {
          continue;
        }
        output.items.properties = arrayItem;
      }
    }
  }
  return nested ? output.items : output;
}

function processObject(object: any, output?: any, nested?: boolean) {
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
      output.properties[key] = processObject(value, output.properties[key]);
      continue;
    }

    if (typ === 'array') {
      output.properties[key] = processArray(value, output.properties[key]);
      continue;
    }

    if (output.properties[key]) {
      const entry = output.properties[key];
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

    output.properties[key] = {};
    output.properties[key].type = typ;

    if (format) {
      output.properties[key].format = format;
    }
  }

  return nested ? output.properties : output;
}


export function generateJsonSchemaFromObject(title, object) {
  let processOutput;
  const output: any = {
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
    processOutput = processObject(object);
    output.type = processOutput.type;
    output.properties = processOutput.properties;

    // For a generated schema, nothing is marked as required
    // This is a modification to the library
    output.required = false;
  }

  if (output.type === 'array') {
    processOutput = processArray(object);
    output.type = processOutput.type;
    output.items = processOutput.items;

    if (output.title) {
      output.items.title = output.title;
      output.title += ' Set';
    }
  }

  // Output
  return output;
}
