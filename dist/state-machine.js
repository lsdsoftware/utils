"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeStateMachine = void 0;
function makeStateMachine(states) {
    var _a, _b;
    let currentStateName = "IDLE";
    (_b = (_a = states[currentStateName]).onTransitionIn) === null || _b === void 0 ? void 0 : _b.call(_a);
    let lock = 0;
    return {
        trigger(eventName, ...args) {
            var _a, _b;
            if (lock)
                throw new Error("Cannot trigger an event synchronously while inside an event handler");
            lock++;
            try {
                const currentState = states[currentStateName];
                if (!(eventName in currentState))
                    throw new Error("Missing handler " + currentStateName + "." + eventName);
                const nextStateName = currentState[eventName](...args);
                if (nextStateName) {
                    if (!(nextStateName in states))
                        throw new Error("Missing state " + nextStateName);
                    currentStateName = nextStateName;
                    (_b = (_a = states[currentStateName]).onTransitionIn) === null || _b === void 0 ? void 0 : _b.call(_a);
                }
            }
            finally {
                lock--;
            }
        },
        getState() {
            return currentStateName;
        }
    };
}
exports.makeStateMachine = makeStateMachine;
