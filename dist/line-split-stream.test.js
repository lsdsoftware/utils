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
Object.defineProperty(exports, "__esModule", { value: true });
const line_split_stream_1 = require("./line-split-stream");
const assert = require("assert");
exports.default = {
    lineSplitStream1() {
        return __awaiter(this, void 0, void 0, function* () {
            const splitter = (0, line_split_stream_1.makeLineSplitStream)();
            splitter.write('This is a line\nThis is another line\nAnd this is a line as well');
            splitter.end();
            const lines = yield new Promise(fulfill => {
                let accum = [];
                splitter.on('data', line => accum.push(line));
                splitter.on('end', () => fulfill(accum));
            });
            assert(lines[0] == "This is a line\n" &&
                lines[1] == "This is another line\n" &&
                lines[2] == "And this is a line as well\n");
        });
    },
    lineSplitStream2() {
        return __awaiter(this, void 0, void 0, function* () {
            const splitter = (0, line_split_stream_1.makeLineSplitStream)();
            splitter.write('\nThis is a line\n');
            splitter.end();
            const lines = yield new Promise(fulfill => {
                let accum = [];
                splitter.on('data', line => accum.push(line));
                splitter.on('end', () => fulfill(accum));
            });
            assert(lines[0] == "\n" &&
                lines[1] == "This is a line\n");
        });
    },
    lineSplitStream3() {
        return __awaiter(this, void 0, void 0, function* () {
            const splitter = (0, line_split_stream_1.makeLineSplitStream)();
            splitter.write('\n\n');
            splitter.end();
            const lines = yield new Promise(fulfill => {
                let accum = [];
                splitter.on('data', line => accum.push(line));
                splitter.on('end', () => fulfill(accum));
            });
            assert(lines[0] == "\n" &&
                lines[1] == "\n");
        });
    },
};
