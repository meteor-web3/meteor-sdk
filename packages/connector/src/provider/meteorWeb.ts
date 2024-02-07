import {
  RequestType,
  SYSTEM_CALL,
  ReturnType,
  Chain,
  WALLET,
  Provider
} from "../types";
import { BaseProvider } from "./base";
import { Communicator } from "@meteor-web3/communicator";
import { ethers } from "ethers";
import "@meteor-web3/meteor-iframe";

declare global {
  interface Window {
    ethereum: any;
  }
}

export class MeteorWebProvider extends BaseProvider {
  private communicator?: Communicator;
  private ethereumProvider?: ethers.providers.ExternalProvider;
  private onInitializing: boolean = false;

  constructor(ethereumProvider?: ethers.providers.ExternalProvider) {
    super();
    this.ethereumProvider = ethereumProvider;
    this.init();
  }

  async init() {
    if (this.onInitializing) {
      await new Promise<void>((resolve) => {
        const timer = setInterval(() => {
          if (!this.onInitializing) {
            clearTimeout(timer);
            resolve();
          }
        }, 100);
      });
      return;
    }
    this.onInitializing = true;
    // await document load
    await new Promise<void>((resolve) => {
      if (document.readyState === "complete") {
        resolve();
      } else {
        document.addEventListener(
          "readystatechange",
          () => document.readyState === "complete" && resolve()
        );
      }
    });
    // document loaded
    const iframe = document.getElementById(
      "meteor-iframe"
    ) as HTMLIFrameElement;
    if (!iframe) {
      throw "Meteor Web wallet failed to load.";
    }
    // await iframe load
    await new Promise<void>((resolve) => {
      if ((window as any).__METEOR_IFRAME_READY__) {
        resolve();
      } else {
        const timer = setInterval(() => {
          if ((window as any).__METEOR_IFRAME_READY__) {
            clearTimeout(timer);
            resolve();
          }
        }, 100);
      }
    });
    // iframe loaded
    if (!(window as any).__METEOR_IFRAME_READY__) {
      throw "Meteor Web wallet failed to load.";
    }
    // prevent destruction before initialization ends
    if (this.destroyed) {
      return;
    }
    this.communicator = new Communicator({
      source: window,
      target: iframe.contentWindow,
      runningEnv: "Client"
    });
    this.ethereumProvider &&
      (await this.setExternalProvider(this.ethereumProvider));
    this.onInitializing = false;
  }

  async setExternalProvider(
    ethereumProvider: ethers.providers.ExternalProvider
  ) {
    if (!this.communicator) {
      await this.init();
    }
    this.communicator.methodHandler = async (args) => {
      // console.log("Client received method call:", args);
      if (args.method === "ethereumRequest") {
        if (!ethereumProvider) {
          throw new Error("No ethereum provider found");
        }
        const res = await ethereumProvider.request(args.params);
        // console.log("Client responded to ethereumRequest:", res);
        return res;
      }
    };
  }

  destroy() {
    if (this.destroyed) return;
    this.communicator?.destroy();
    this.destroyed = true;
  }

  connectWallet = async (params?: {
    provider?: Provider;
  }): Promise<{
    address: string;
    chain: Chain;
    wallet: WALLET;
    userInfo?: any;
  }> => {
    if (!this.communicator) {
      await this.init();
    }
    if (params?.provider) {
      this.setExternalProvider(params.provider);
    }
    const res = (await this.communicator.sendRequest({
      postMessageTo: "Kernel",
      method: "connectWallet"
    })) as {
      address: string;
      chain: {
        chainId: number;
        chainName: string;
      };
      wallet: string;
      userInfo?: any;
    };

    this.isConnected = true;
    this.wallet = res.wallet as WALLET;
    this.address = res.address;
    this.chain = res.chain;
    this.userInfo = res.userInfo;
    this._provider = window.ethereum;

    return {
      wallet: this.wallet,
      address: this.address,
      chain: this.chain,
      userInfo: this.userInfo
    };
  };

  getCurrentWallet = async (): Promise<
    | {
        address: string;
        chain: Chain;
        wallet: WALLET;
      }
    | undefined
  > => {
    return {
      wallet: this.wallet,
      address: this.address,
      chain: this.chain
    };
  };

  runOS = async <T extends SYSTEM_CALL>({
    method,
    params
  }: {
    method: T;
    params?: RequestType[T];
  }): Promise<Awaited<ReturnType[T]>> => {
    if (!this.communicator) {
      await this.init();
    }
    if (
      method !== SYSTEM_CALL.checkCapability &&
      method !== SYSTEM_CALL.loadFile &&
      method !== SYSTEM_CALL.loadFilesBy &&
      (method !== SYSTEM_CALL.loadFilesBy ||
        (method === SYSTEM_CALL.loadFilesBy &&
          (params as RequestType[SYSTEM_CALL.loadFilesBy]).fileIds)) &&
      !this?.isConnected
    ) {
      throw new Error("Please connect wallet first");
    }

    const res = await this.communicator.sendRequest({
      postMessageTo: "Kernel",
      method,
      params
    });

    if (method === SYSTEM_CALL.createCapability) {
      this.appId = (params as RequestType[SYSTEM_CALL.createCapability]).appId;
    }

    return res as ReturnType[SYSTEM_CALL];
  };
}
