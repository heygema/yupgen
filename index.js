const fs = require("fs");
const http = require("http");
const prettier = require("prettier");

const outputFolder = "./output/";

fs.exists("output", existed => {
  if (!existed) {
    fs.mkdirSync("output");
  }
});

function bracketBreaker(input) {
  return input.replace(/\(/g, "(_").split("_");
}

function resolveSchema(data) {
  const object = "object()";
  const shape = "shape()";
  const string = "string()";
  const array = "array()";
  const number = "number()";
  const required = "required()";
  const of = "of()";

  let result = "";

  switch (typeof data) {
    case "string":
      return `${string}.${required}`;
    case "number":
      return `${number}.${required}`;
  }

  if (Array.isArray(data)) {
    let [startOf, endOf] = bracketBreaker(of);
    if (data.length === 0) {
      return array;
    }
    return `${array}.${startOf}${resolveSchema(data[0])}${endOf}`;
  }

  if (!data) {
    return string;
  }

  if (typeof data === "object" && !Array.isArray(data)) {
    let [startShape, endShape] = bracketBreaker(shape);
    let objResult = "";
    for (let key of Object.keys(data)) {
      let value = data[key];
      objResult += `${key}: ${resolveSchema(value)}, \n`;
    }

    result = `${object}.${startShape}{${objResult}}${endShape}.defined()`;
  }

  return result;
}

function getSchema(data, name) {
  let imports = `import {object, string, array, number, InferType} from 'yup';`;
  let declaration = `export const ${name} = `;
  let typing = `export type TypeOf${name} = InferType<typeof ${name}>;`;
  return `${imports}\n\n${declaration}${resolveSchema(data)};\n\n${typing}`;
}

http
  .createServer((req, res) => {
    res.setHeader("Content-Type", "application/json");
    let endMsg = JSON.stringify({
      message: "Request Finished"
    });
    let invalidMethod = JSON.stringify({
      message: "Invalid Method use POST"
    });
    if (req.method !== "POST") {
      res.end(invalidMethod);
    }
    switch (req.url) {
      case "/":
        let body = "";
        req.on("data", chunk => {
          body += chunk.toString();
        });
        req.on("end", () => {
          let parsedBody = JSON.parse(body || {});
          let fileName = (parsedBody && parsedBody.file) || "default.txt";
          let isTypeGen = (parsedBody && parsedBody.typegen) || false;
          let data = (parsedBody && parsedBody.data) || {};

          let formatted = prettier.format(
            getSchema(data, fileName.split(".")[0] || "noName"),
            {
              semi: false,
              parser: "babel"
            }
          );

          fs.writeFile(
            outputFolder + (isTypeGen ? `${fileName}.ts` : fileName),
            isTypeGen ? formatted : JSON.stringify(data, null, 2),
            (err, _) => {
              if (err) {
                res.end(
                  JSON.stringify({
                    message: "Writing file error"
                  })
                );
              } else {
                res.end(JSON.stringify({ message: "finished" }));
              }
            }
          );

          res.statusCode = 200;
          res.end(endMsg);
        });

      default:
        res.statusCode = 404;
        res.end(endMsg);
    }
  })
  .listen(8091, () => {
    console.log("running on 8091");
  });
