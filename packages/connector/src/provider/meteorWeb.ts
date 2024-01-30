import {
  RequestType,
  SYSTEM_CALL,
  ReturnType,
  Chain,
  WALLET,
  Provider
} from "../types";
import { MeteorBaseProvider } from "./meteorBase";
import { IframeCommunicator } from "@meteor-web3/communicator";
import { ethers } from "ethers";

declare global {
  interface Window {
    ethereum: any;
  }
}

export class MeteorWebProvider extends MeteorBaseProvider {
  private communicator: IframeCommunicator;

  constructor(
    iframeWindow: Window,
    ethereumProvider: ethers.providers.ExternalProvider
  ) {
    super();
    this.communicator = new IframeCommunicator({
      source: window,
      target: iframeWindow,
      runningEnv: "Client"
    });
    this.setExternalProvider(ethereumProvider);
  }

  setExternalProvider(ethereumProvider: ethers.providers.ExternalProvider) {
    this.communicator.methodHandler = async (args) => {
      // console.log("Client received method call:", args);
      if (args.method === "ethereumRequest") {
        const res = await ethereumProvider.request(args.params);
        // console.log("Client responded to ethereumRequest:", res);
        return res;
      }
    };
  }

  destroy() {
    if (this.destroyed) return;
    this.communicator.destroy();
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
