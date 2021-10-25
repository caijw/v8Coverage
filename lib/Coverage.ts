import { readdir, readFile } from "fs/promises";
import { readFileSync } from "fs";
import path from "path";
import type {
  RangeUseCount,
  ScriptCoverageResults,
  ScriptCoverageSource,
  CoverageSegment,
  CoverageResult,
} from "./spec";

export default class Coverage {
  private coverageJsonFile: string;
  private files: string[];
  private constructor(coverageJsonFile: string, files: string[]) {
    this.coverageJsonFile = coverageJsonFile;
    this.files = files;
  }
  private coverageResults: CoverageResult[] = [];
  static create(dir: string, files: string[]) {
    return new Coverage(dir, files);
  }
  public async run() {
    return this.doCoverage();
  }
  private async doCoverage() {
    const coverageString = (await readFile(this.coverageJsonFile)).toString();
    const content: ScriptCoverageResults = JSON.parse(coverageString);
    const timestamp = content.timestamp || 0;
    const coverageSources: ScriptCoverageSource[] = [];
    content.result.forEach((coverage) => {
      this.files.forEach((file) => {
        if (coverage.url.indexOf(file) !== -1) {
          coverageSources.push({
            source: readFileSync(
              path.resolve(path.dirname(this.coverageJsonFile), file)
            ).toString(),
            coverage,
            timestamp,
            file,
            url: coverage.url,
          });
        }
      });
    }, []);
    for (const coverageSource of coverageSources) {
      this.calculateCoverage(coverageSource);
    }
  }
  private calculateCoverage(coverageSource: ScriptCoverageSource) {
    const ranges = [];
    for (const func of coverageSource.coverage.functions) {
      for (const range of func.ranges) {
        ranges.push(range);
      }
    }
    const segments = this.convertToDisjointSegments(
      ranges,
      coverageSource.timestamp
    );
    const last = segments[segments.length - 1];
    if (last && last.end < coverageSource.source.length) {
      segments.push({
        end: coverageSource.source.length,
        stamp: coverageSource.timestamp,
        count: 0,
      });
    }
    const mergedSegments = Coverage.mergeSegments([], segments);
    const usedSize = this.updateStats(mergedSegments);
    this.coverageResults.push({
      usedSize,
      totalSize: coverageSource.source.length,
      file: coverageSource.file,
      url: coverageSource.url,
    });
  }
  private convertToDisjointSegments(
    ranges: RangeUseCount[],
    stamp: number
  ): CoverageSegment[] {
    ranges.sort((a, b) => a.startOffset - b.startOffset);

    const result: CoverageSegment[] = [];
    const stack = [];
    for (const entry of ranges) {
      let top: RangeUseCount = stack[stack.length - 1];
      while (top && top.endOffset <= entry.startOffset) {
        append(top.endOffset, top.count);
        stack.pop();
        top = stack[stack.length - 1];
      }
      append(entry.startOffset, top ? top.count : 0);
      stack.push(entry);
    }

    for (let top = stack.pop(); top; top = stack.pop()) {
      append(top.endOffset, top.count);
    }

    function append(end: number, count: number): void {
      const last = result[result.length - 1];
      if (last) {
        if (last.end === end) {
          return;
        }
        if (last.count === count) {
          last.end = end;
          return;
        }
      }
      result.push({ end: end, count: count, stamp: stamp });
    }

    return result;
  }
  private static mergeSegments(
    segmentsA: CoverageSegment[],
    segmentsB: CoverageSegment[]
  ): CoverageSegment[] {
    const result: CoverageSegment[] = [];

    let indexA = 0;
    let indexB = 0;
    while (indexA < segmentsA.length && indexB < segmentsB.length) {
      const a = segmentsA[indexA];
      const b = segmentsB[indexB];
      const count = (a.count || 0) + (b.count || 0);
      const end = Math.min(a.end, b.end);
      const last = result[result.length - 1];
      const stamp = Math.min(a.stamp, b.stamp);
      if (!last || last.count !== count || last.stamp !== stamp) {
        result.push({ end: end, count: count, stamp: stamp });
      } else {
        last.end = end;
      }
      if (a.end <= b.end) {
        indexA++;
      }
      if (a.end >= b.end) {
        indexB++;
      }
    }

    for (; indexA < segmentsA.length; indexA++) {
      result.push(segmentsA[indexA]);
    }
    for (; indexB < segmentsB.length; indexB++) {
      result.push(segmentsB[indexB]);
    }
    return result;
  }
  public getCoverageResults() {
    return this.coverageResults;
  }

  private updateStats(segments: CoverageSegment[]): number {
    const statsByTimestamp = new Map();
    let usedSize = 0;
    let last = 0;
    for (const segment of segments) {
      let previousCount = statsByTimestamp.get(segment.stamp);
      if (previousCount === undefined) {
        previousCount = 0;
      }

      if (segment.count) {
        const used = segment.end - last;
        usedSize += used;
        statsByTimestamp.set(segment.stamp, previousCount + used);
      }
      last = segment.end;
    }
    return usedSize;
  }
}
