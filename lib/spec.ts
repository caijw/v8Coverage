export type integer = number;
type OpaqueType<Tag extends string> = { protocolOpaqueTypeTag: Tag };
type OpaqueIdentifier<
  RepresentationType,
  Tag extends string
> = RepresentationType & OpaqueType<Tag>;
/**
 * Unique script identifier.
 */
export type ScriptId = OpaqueIdentifier<string, "Protocol.Runtime.ScriptId">;

/**
 * Coverage data for a source range.
 */
export type CoverageRange = {
  /**
   * JavaScript script source offset for the range start.
   */
  startOffset: integer;
  /**
   * JavaScript script source offset for the range end.
   */
  endOffset: integer;
  /**
   * Collected execution count of the source range.
   */
  count: integer;
}

export type RangeUseCount = {
  startOffset: number;
  endOffset: number;
  count: number;
}

export type CoverageSegment = {
  end: number;
  count: number;
  stamp: number;
}

/**
 * Coverage data for a JavaScript function.
 */
export type FunctionCoverage = {
  /**
   * JavaScript function name.
   */
  functionName: string;
  /**
   * Source ranges inside the function with coverage data.
   */
  ranges: CoverageRange[];
  /**
   * Whether coverage data for this function has block granularity.
   */
  isBlockCoverage: boolean;
}

/**
 * Coverage data for a JavaScript script.
 */
export type ScriptCoverage = {
  /**
   * JavaScript script id.
   */
  scriptId: ScriptId;
  /**
   * JavaScript script name or url.
   */
  url: string;
  /**
   * Functions contained in the script that has coverage data.
   */
  functions: FunctionCoverage[];
}

export type ScriptCoverageSource = {
  source: string;
  coverage: ScriptCoverage;
  timestamp: number;
  file: string;
  url: string;
}

export type ScriptCoverageResults = {
  timestamp: number
  result: Array<ScriptCoverage>
}

export type CoverageResult = {
  usedSize: number;
  totalSize: number;
  file: string;
  url: string;
}

