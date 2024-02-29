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
const line_reader_1 = require("./line-reader");
const assert = require("assert");
exports.default = {
    lineReader1() {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = [];
            const splitter = (0, line_reader_1.makeLineReader)(line => lines.push(line));
            splitter.write('This is a line\nThis is another line\nAnd this is a line as well');
            splitter.end();
            assert(lines[0] == "This is a line" &&
                lines[1] == "This is another line" &&
                lines[2] == "And this is a line as well");
        });
    },
    lineReader2() {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = [];
            const splitter = (0, line_reader_1.makeLineReader)(line => lines.push(line));
            splitter.write('\nThis is a line\n');
            splitter.end();
            assert(lines[0] == "" &&
                lines[1] == "This is a line");
        });
    },
    lineReader3() {
        return __awaiter(this, void 0, void 0, function* () {
            const lines = [];
            const splitter = (0, line_reader_1.makeLineReader)(line => lines.push(line));
            splitter.write('\n\n');
            splitter.end();
            assert(lines[0] == "" &&
                lines[1] == "");
        });
    },
};
