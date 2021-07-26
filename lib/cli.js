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
let defaultOutput = `${currentPath}/schemas`;

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

async function checkOutDir(dir) {
  try {
    let fileStat = await fs.promises.stat(dir);

    if (fileStat.isFile()) {
      throw new Error("outDir must be a directory");
    }
    if (fileStat.isDirectory()) {
      return;
    }
  } catch {
    console.log(
      warning("Creating directory for output on %s"),
      path.relative(currentPath, dir)
    );
    await fs.promises.mkdir(dir);
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

async function processSchema() {
  try {
    let { types, options } = await getConfig();
    let isTypeScript = await checkTsConfig();
    let typescriptMsg = isTypeScript
      ? "Typescript project detected, creating schema for TypeScript (.ts)"
      : "No typescript config detected, creating schema for JavaScript (.js)";

    console.log(chalk.green("yupgen version: %s"), version);
    console.log(warning(typescriptMsg), "\n");

    let outputPath = options?.outDir
      ? path.resolve(currentPath, options.outDir)
      : defaultOutput;
    await checkOutDir(outputPath);

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

      let writeTo = `${outputPath}/${name}${isTypeScript ? ".ts" : ".js"}`;
      let relativePath = path.relative(currentPath, writeTo);
      console.log(
        `🚀🤨 Generating schemas for ${chalk.blueBright(
          name
        )}! on ${chalk.green(relativePath)}`
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

function init() {
  const defaultConfig = {
    types: [
      {
        name: "todo",
        source: "https://jsonplaceholder.typicode.com/todos/1",
        method: "GET"
      }
    ]
  };

  try {
    let config = JSON.stringify(defaultConfig, null, 2);
    fs.promises.writeFile(configPath, config);
  } catch (e) {
    console.error(error(e.message));
  }
}

function main() {
  if (process.argv[2] === "init") {
    init();
  } else {
    processSchema();
  }
}

main();
