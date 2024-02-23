export type Message = Request | Notification | Response;
interface Request {
    to: string;
    type: "request";
    id: "string";
    method: string;
    args: Record<string, unknown>;
}
interface Notification {
    to: string;
    type: "notification";
    method: string;
    args: Record<string, unknown>;
}
interface Response {
    type: "response";
    id: string;
    error: unknown;
    result: unknown;
}
interface RequestHandler {
    (args: Record<string, unknown>, sender: unknown): unknown;
}
export declare function makeMessageDispatcher(myAddress: string, requestHandlers: Record<string, RequestHandler>): {
    waitForResponse<T>(requestId: string): Promise<T>;
    dispatch(message: Message, sender: unknown, sendResponse: (res: Response) => void): boolean | void;
    updateRequestHandlers(newHandlers: typeof requestHandlers): void;
};
export {};
