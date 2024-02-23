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
const state_machine_1 = require("./state-machine");
const assert = require("assert");
exports.default = {
    stateMachine1() {
        return __awaiter(this, void 0, void 0, function* () {
            const sm = (0, state_machine_1.makeStateMachine)({
                IDLE: {
                    play() {
                        return "PLAYING";
                    },
                    stop() { },
                    goto(state) {
                        return state;
                    }
                },
                PLAYING: {
                    play() { },
                    stop() {
                        return "STOPPING";
                    }
                },
                STOPPING: {
                    onTransitionIn() {
                        this.timer = setTimeout(() => sm.trigger("onStop"), 2000);
                    },
                    onStop() {
                        return "IDLE";
                    },
                    play() {
                        clearTimeout(this.timer);
                        return "PLAYING";
                    },
                    stop() { }
                },
                STUCK: {}
            });
            assert(sm.getState() == "IDLE");
            sm.trigger("play");
            assert(sm.getState() == "PLAYING");
            sm.trigger("stop");
            assert(sm.getState() == "STOPPING");
            yield sleep(1000);
            sm.trigger("play");
            assert(sm.getState() == "PLAYING");
            yield sleep(3000);
            assert(sm.getState() == "PLAYING");
            sm.trigger("stop");
            assert(sm.getState() == "STOPPING");
            yield sleep(3000);
            assert(sm.getState() == "IDLE");
            sm.trigger("goto", "STUCK");
            assert(sm.getState() == "STUCK");
        });
    },
};
function sleep(ms) {
    return new Promise(f => setTimeout(f, ms));
}
