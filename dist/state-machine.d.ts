type EventHandler<StateName> = (...args: any) => StateName | void;
export type State<StateName extends string, EventName extends string> = Partial<Record<EventName | "onTransitionIn", EventHandler<StateName>>>;
export declare function makeStateMachine<StateName extends string, EventName extends string>(states: Record<StateName | "IDLE", State<StateName, EventName>>): {
    trigger(eventName: EventName, ...args: any): void;
    getState(): StateName | "IDLE";
};
export {};
