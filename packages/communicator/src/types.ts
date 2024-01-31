export interface RequestInputs {
  method: string;
  params?: any;
  postMessageTo: RunningEnv;
}

export interface RequestArguments {
  sequenceId: string;
  type: "request";
  postMessageTo: RunningEnv;
}

export interface ResponseArguments {
  sequenceId: string;
  type: "response";
  result: object;
}

/**
 * @deprecated use RunningEnv instead
 */
export type PostMessageTo = "Extension" | "Browser";
export type RunningEnv = PostMessageTo | "Client" | "Kernel";

export type Any = Record<string, any>;

export interface Message extends Any {
  type: string;
  wallet?: string;
  method?: string;
  params?: any[];
}

export interface EventMessage {
  type: string;
  wallet?: string;
  method?: string;
  params?: any;
}
