"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.makeMessageDispatcher = void 0;
function makeMessageDispatcher(myAddress, requestHandlers) {
    const pendingRequests = new Map();
    return {
        waitForResponse(requestId) {
            let pending = pendingRequests.get(requestId);
            if (!pending)
                pendingRequests.set(requestId, pending = makePending());
            return pending.promise;
        },
        dispatch(message, sender, sendResponse) {
            switch (message.type) {
                case "request": return handleRequest(message, sender, sendResponse);
                case "notification": return handleNotification(message, sender);
                case "response": return handleResponse(message);
            }
        },
        updateRequestHandlers(newHandlers) {
            requestHandlers = newHandlers;
        }
    };
    function makePending() {
        const pending = {};
        pending.promise = new Promise((fulfill, reject) => {
            pending.fulfill = fulfill;
            pending.reject = reject;
        });
        return pending;
    }
    function handleRequest(req, sender, sendResponse) {
        if (req.to == myAddress) {
            if (requestHandlers[req.method]) {
                Promise.resolve()
                    .then(() => requestHandlers[req.method](req.args, sender))
                    .then(result => sendResponse({ type: "response", id: req.id, result, error: undefined }), error => sendResponse({ type: "response", id: req.id, result: undefined, error }));
                //let caller know that sendResponse will be called asynchronously
                return true;
            }
            else {
                console.error("No handler for method", req);
            }
        }
    }
    function handleNotification(ntf, sender) {
        if (ntf.to == myAddress) {
            if (requestHandlers[ntf.method]) {
                Promise.resolve()
                    .then(() => requestHandlers[ntf.method](ntf.args, sender))
                    .catch(error => console.error("Failed to handle notification", ntf, error));
            }
            else {
                console.error("No handler for method", ntf);
            }
        }
    }
    function handleResponse(res) {
        const pending = pendingRequests.get(res.id);
        if (pending) {
            pendingRequests.delete(res.id);
            if (res.error)
                pending.reject(res.error);
            else
                pending.fulfill(res.result);
        }
        else {
            console.error("Stray response", res);
        }
    }
}
exports.makeMessageDispatcher = makeMessageDispatcher;
