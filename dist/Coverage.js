"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promises_1 = require("fs/promises");
const fs_1 = require("fs");
const path_1 = __importDefault(require("path"));
class Coverage {
    constructor(coverageJsonFile, files) {
        this.coverageResults = [];
        this.coverageJsonFile = coverageJsonFile;
        this.files = files;
    }
    static create(dir, files) {
        return new Coverage(dir, files);
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            return this.doCoverage();
        });
    }
    doCoverage() {
        return __awaiter(this, void 0, void 0, function* () {
            const coverageString = (yield (0, promises_1.readFile)(this.coverageJsonFile)).toString();
            const content = JSON.parse(coverageString);
            const timestamp = content.timestamp || 0;
            const coverageSources = [];
            content.result.forEach((coverage) => {
                this.files.forEach((file) => {
                    if (coverage.url.indexOf(file) !== -1) {
                        coverageSources.push({
                            source: (0, fs_1.readFileSync)(path_1.default.resolve(path_1.default.dirname(this.coverageJsonFile), file)).toString(),
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
        });
    }
    calculateCoverage(coverageSource) {
        const ranges = [];
        for (const func of coverageSource.coverage.functions) {
            for (const range of func.ranges) {
                ranges.push(range);
            }
        }
        const segments = this.convertToDisjointSegments(ranges, coverageSource.timestamp);
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
    convertToDisjointSegments(ranges, stamp) {
        ranges.sort((a, b) => a.startOffset - b.startOffset);
        const result = [];
        const stack = [];
        for (const entry of ranges) {
            let top = stack[stack.length - 1];
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
        function append(end, count) {
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
    static mergeSegments(segmentsA, segmentsB) {
        const result = [];
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
            }
            else {
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
    getCoverageResults() {
        return this.coverageResults;
    }
    updateStats(segments) {
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
exports.default = Coverage;
