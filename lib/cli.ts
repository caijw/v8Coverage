#!/usr/bin/env node
import { program } from "commander";
import Coverage from "./Coverage";
import Table from "cli-table3";

program.version("0.0.1");

program
  .requiredOption("-c, --coverage <json file path>", "coverage json file path")
  .requiredOption("-f, --files <files...>", "script files to coverage")
  .parse();

// console.log(program.opts())

const coverage = Coverage.create(program.opts().coverage, program.opts().files);

coverage
  .run()
  .then(() => {
    const table = new Table({ head: ["file", "used size", "total size", "coverage"] });
    const tableBody : Record<string, [number, number, string]> = {}
    const coverageResults = coverage.getCoverageResults()

    for (const result of coverageResults) {
      const { usedSize, totalSize, file } = result
      tableBody[file] = [ usedSize, totalSize, `${(usedSize / totalSize * 100).toFixed(2)}%` ]
    }
    table.push(tableBody)
    console.log(table.toString());
  })
  .catch((err) => {
    console.error(err);
  });
