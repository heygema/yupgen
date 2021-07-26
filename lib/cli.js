#!/usr/bin/env node
const { version } = require("../package.json");
const chalk = require("chalk");
const fs = require("fs");
const crypto = require("crypto");
const exec = require("child_process").exec;
const promisify = require("util").promisify;
const path = require("path");
const prettier = require("prettier");

const getSchema = require("./getSchema");

const execAsync = promisify(exec);
const currentPath = process.cwd();
const configFile = "yupgen.json";

let configPath = `${currentPath}/${configFile}`;
let tsConfigPath = `${currentPath}/tsconfig.json`;
let defaultOutput = `${currentPath}/types/`;

const error = chalk.bold.red;
const warning = chalk.bold.yellow;

async function getConfig() {
  try {
    let file = await fs.promises.readFile(configPath, "utf-8");

    let parsed = JSON.parse(file);

    return parsed;
  } catch (e) {
    console.error(error(e.message));
    return {};
  }
}

async function checkTsConfig() {
  try {
    let tsconfig = await fs.promises.stat(tsConfigPath);
    let isTypeScript = tsconfig.isFile();
    return isTypeScript;
  } catch {
    return false;
  }
}

/*
Structure for source config file
{
  types: [
   {
      name: "string",
      source: "string",
      method: "GET" | "POST",
      body: "string",
    }
  ]
}
  */

async function main() {
  try {
    let { types, options } = await getConfig();
    let isTypeScript = await checkTsConfig();
    let typescriptMsg = isTypeScript
      ? "Typescript project detected, creating schema for TypeScript (.ts)"
      : "No typescript config detected, creating schema for JavaScript (.js)";

    console.log(chalk.green("yupgen version: %s"), version);
    console.log(warning(typescriptMsg), "\n");

    let outputPath = options?.outputDir
      ? path.resolve(currentPath, options.outputDir)
      : defaultOutput;

    for (let type of types) {
      let {
        name = "type_" +
          crypto
            .createHash("sha256")
            .update(Math.random().toString(), "utf-8")
            .digest("hex"),
        source,
        method = "GET",
        body = {}
      } = type;

      if (!source) {
        throw new Error("Must provide source: URI");
      }

      let writeTo = `${outputPath}${name}${isTypeScript ? ".ts" : ".js"}`;
      let relativePath = path.relative(currentPath, writeTo);
      console.log(
        `🚀🤨 Generating types for ${chalk.blueBright(name)}! on ${chalk.green(
          relativePath
        )}`
      );

      let curlString = `curl -s -X ${method} ${source} -d ${JSON.stringify(
        body
      )}`;

      let { stdout } = await execAsync(curlString);

      let schema = getSchema(JSON.parse(stdout), name, isTypeScript);

      let formatted = prettier.format(schema, {
        semi: false,
        parser: "babel"
      });

      fs.promises.writeFile(writeTo, formatted);
    }
  } catch (e) {
    console.error(error(e.message));
  }
}

main();
