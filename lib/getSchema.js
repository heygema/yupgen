function bracketBreaker(input = "") {
  return String(input).replace(/\(/g, "(_").split("_");
}

const object = "object()";
const shape = "shape()";
const string = "string()";
const boolean = "boolean()";
const array = "array()";
const number = "number()";
const required = "required()";
const of = "of()";
const mixed = "mixed()";
const nullable = "nullable()";

function resolveSchema(data, dataTypes = []) {
  // array, string, object, etc
  let availableDataTypes = dataTypes;
  let result = "";

  switch (typeof data) {
    case "string":
      availableDataTypes = [...availableDataTypes, "string"];
      return {
        availableDataTypes: [...new Set(availableDataTypes)],
        result: `${string}.${required}`
      };
    case "number":
      availableDataTypes = [...availableDataTypes, "number"];
      return {
        availableDataTypes: [...new Set(availableDataTypes)],
        result: `${number}.${required}`
      };
    case "boolean":
      availableDataTypes = [...availableDataTypes, "boolean"];
      return {
        availableDataTypes: [...new Set(availableDataTypes)],
        result: `${boolean}.${required}`
      };
  }

  if (Array.isArray(data)) {
    availableDataTypes = [...availableDataTypes, "array"];
    let [ofOpen, ofClose] = bracketBreaker(of);
    if (data.length === 0) {
      return array;
    }

    let schemaResult = resolveSchema(data[0], availableDataTypes);

    availableDataTypes = [
      ...availableDataTypes,
      ...schemaResult.availableDataTypes
    ];
    return {
      availableDataTypes: [...new Set(availableDataTypes)],
      result: `${array}.${ofOpen}${schemaResult.result}${ofClose}`
    };
  }

  if (!data) {
    availableDataTypes = [...availableDataTypes, "mixed"];

    return {
      availableDataTypes: [...new Set(availableDataTypes)],
      result: `${mixed}.${nullable}`
    };
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    availableDataTypes = [...availableDataTypes, "object"];
    let [shapeOpen, shapeClose] = bracketBreaker(shape);
    let objResult = "";
    for (let key of Object.keys(data)) {
      let value = data[key];

      let schemaResult = resolveSchema(value, availableDataTypes);

      availableDataTypes = [
        ...availableDataTypes,
        ...schemaResult.availableDataTypes
      ];

      objResult += `${key}: ${schemaResult.result}, \n`;
    }

    return {
      availableDataTypes: [...new Set(availableDataTypes)],
      result: `${object}.${shapeOpen}{${objResult}}${shapeClose}.defined()`
    };
  }

  return {
    availableDataTypes: [...new Set(availableDataTypes)],
    result
  };
}

function getSchema(data, name = "noName", isTypeScript = false) {
  let declaration = `export const ${name} = `;
  let capitalizedName = `${name.slice(0, 1).toUpperCase()}${name.slice(1)}`;
  let typing = `export type ${capitalizedName} = InferType<typeof ${name}>;`;

  let schemaResult = resolveSchema(data);

  let imports = `import {${schemaResult.availableDataTypes.join(
    ", "
  )}} from 'yup';`;

  let schema = `${imports}\n\n${declaration}${schemaResult.result};`;

  if (isTypeScript) {
    schema += `\n\n${typing}`;
  }

  return schema;
}

module.exports = getSchema;
