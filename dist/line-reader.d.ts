import { Writable } from "stream";
export declare function makeLineReader(lineCallback: (line: string) => void): Writable;
