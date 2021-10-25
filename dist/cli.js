#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const Coverage_1 = __importDefault(require("./Coverage"));
const cli_table3_1 = __importDefault(require("cli-table3"));
commander_1.program.version("0.0.1");
commander_1.program
    .requiredOption("-c, --coverage <json file path>", "coverage json file path")
    .requiredOption("-f, --files <files...>", "script files to coverage")
    .parse();
// console.log(program.opts())
const coverage = Coverage_1.default.create(commander_1.program.opts().coverage, commander_1.program.opts().files);
coverage
    .run()
    .then(() => {
    const table = new cli_table3_1.default({ head: ["file", "used size", "total size", "coverage"] });
    const tableBody = {};
    const coverageResults = coverage.getCoverageResults();
    for (const result of coverageResults) {
        const { usedSize, totalSize, file } = result;
        tableBody[file] = [usedSize, totalSize, `${(usedSize / totalSize * 100).toFixed(2)}%`];
    }
    table.push(tableBody);
    console.log(table.toString());
})
    .catch((err) => {
    console.error(err);
});
