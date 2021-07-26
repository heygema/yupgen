#!/usr/bin/env node
const fs = require("fs");
const exec = require("child_process").exec;
const promisify = require("util").promisify;
const path = require("path");
const prettier = require("prettier");

const getSchema = require("./getSchema");

const execAsync = promisify(exec);
const currentPath = process.cwd();
const configFile = "yupgen.config.json";

let configPath = `${currentPath}/${configFile}`;
let tsConfigPath = `${currentPath}/tsconfig.json`;
let defaultOutput = `${currentPath}/types/`;

async function getConfig() {
  try {
    let file = await fs.promises.readFile(configPath, "utf-8");

    let parsed = JSON.parse(file);

    return parsed;
  } catch (e) {
    console.error(e.message);
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

async function main() {
  try {
    let { types, options } = await getConfig();
    let isTypeScript = await checkTsConfig();

    let outputPath = options?.outputDir
      ? path.resolve(currentPath, options.outputDir)
      : defaultOutput;

    for (let fileName of Object.keys(types)) {
      let writeTo = `${outputPath}${fileName}${isTypeScript ? ".ts" : ".js"}`;
      let relativePath = path.relative(__dirname, writeTo);
      console.log(`🚀🤨 Generating types for ${fileName}! on ${relativePath}`);
      let source = types[fileName];
      let { stdout } = await execAsync("curl " + source);

      let schema = getSchema(JSON.parse(stdout), fileName, isTypeScript);

      let formatted = prettier.format(schema, {
        semi: false,
        parser: "babel"
      });

      fs.promises.writeFile(writeTo, formatted);
    }
  } catch (e) {
    console.error(e.message);
  }
}

main();
