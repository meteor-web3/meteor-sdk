import { CORRECT_CODE, RESPONSE, UNKNOWN_CODE } from "./constants";
import { RequestInputs, RequestArguments, PostMessageTo } from "./types";
import { Communicator } from "./communicator";

export type RunningEnv = "Client" | "Kernel" | PostMessageTo;

export class IframeCommunicator extends Communicator {
  private runningEnv: RunningEnv;

  constructor({
    source,
    target,
    runningEnv,
    methodClass,
    methodHandler
  }: {
    source: Window;
    target: Window;
    runningEnv: RunningEnv;
    methodClass?: any;
    methodHandler?: (args: RequestArguments & RequestInputs) => void;
  }) {
    super({ source, target, methodClass });
    this.runningEnv = runningEnv;
    if (methodHandler) {
      this.onRequestMessage(async (event) => {
        const args = event.data as RequestArguments & RequestInputs;

        // if code running env is different from postMessageTo, it will return and do nothing
        if ((args.postMessageTo as string) !== this.runningEnv) {
          return;
        }

        let result: { code: string; result?: any; error?: string } = {
          code: UNKNOWN_CODE
        };
        let isMethodClassHasMethod: boolean = false;

        if (!methodHandler && !this.methodClass) {
          result = {
            code: UNKNOWN_CODE,
            error:
              "Please pass in the methodClass or method handler, in order to call methods in the class"
          };
        } else {
          if (methodHandler) {
            isMethodClassHasMethod = true;
            try {
              const res = await methodHandler(args);
              result = { code: CORRECT_CODE, result: res };
            } catch (error: any) {
              console.log(error);
              result = {
                code: error?.code || UNKNOWN_CODE,
                error: error?.msg || error?.message
              };
            }
          } else if (this.methodClass[args.method]) {
            isMethodClassHasMethod = true;
            try {
              const res = await this.methodClass[args.method](args.params);
              result = { code: CORRECT_CODE, result: res };
            } catch (error: any) {
              console.log(error);
              result = {
                code: error?.code || UNKNOWN_CODE,
                error: error?.msg || error?.message
              };
            }
          }
        }

        if (!this.methodClass || isMethodClassHasMethod) {
          this.sendResponse({
            sequenceId: args.sequenceId,
            type: RESPONSE,
            result,
            origin: event.origin
          });
        }
      });
    }
  }

  sendRequest(args: {
    method: string;
    params?: any;
    postMessageTo: RunningEnv;
  }): Promise<unknown> {
    return super.sendRequest(args as any);
  }
}
