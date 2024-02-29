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
const line_reader_test_1 = require("./line-reader.test");
run(Object.assign({}, line_reader_test_1.default))
    .catch(console.error);
function run(tests) {
    return __awaiter(this, void 0, void 0, function* () {
        for (const name in tests) {
            console.log("Running test", name);
            yield tests[name]();
        }
    });
}
