/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  RequestType,
  SYSTEM_CALL,
  ReturnType,
  Chain,
  WALLET,
  Provider,
  AuthType
} from "../types";
import { EthersProvider, IProvider } from "./types";

export abstract class BaseProvider implements IProvider {
  destroyed: boolean = false;
  _provider?: EthersProvider;
  isConnected?: boolean;
  wallet?: WALLET;
  address?: string;
  chain?: Chain;
  appId?: string;
  userInfo?: any;

  constructor() {}

  abstract destroy(): void;

  on(event: string, listener: Function): this {
    if (!this._provider) {
      throw new Error("Please connect wallet first");
    }
    return this._provider.on(event, listener), this;
  }
  off(event: string, listener?: Function): this {
    if (!this._provider) {
      throw new Error("Please connect wallet first");
    }
    return this._provider.off(event, listener), this;
  }
  request({
    method,
    params
  }: {
    method: string;
    params?: any[];
  }): Promise<any> {
    if (!this._provider) {
      throw new Error("Please connect wallet first");
    }
    return this._provider.request({ method, params });
  }

  getProvider(): EthersProvider {
    return this._provider;
  }

  abstract connectWallet: (params?: {
    wallet?: WALLET | undefined;
    preferredAuthType?: AuthType;
    provider?: Provider;
  }) => Promise<{
    address: string;
    chain: Chain;
    wallet: WALLET;
    userInfo?: any;
  }>;

  abstract getCurrentWallet: () => Promise<
    | {
        address: string;
        chain: Chain;
        wallet: WALLET;
      }
    | undefined
  >;

  abstract runOS: <T extends SYSTEM_CALL>({
    method,
    params,
    request
  }: {
    method: T;
    params?: RequestType[T];
    request?: Function;
  }) => Promise<Awaited<ReturnType[T]>>;

  async runOSCommon<T extends SYSTEM_CALL>({
    method,
    params,
    request
  }: {
    method: T;
    params?: RequestType[T];
    request: () => Promise<any>;
  }): Promise<Awaited<ReturnType[T]>> {
    if (
      method !== SYSTEM_CALL.checkCapability &&
      method !== SYSTEM_CALL.loadFile &&
      method !== SYSTEM_CALL.loadFilesBy &&
      method !== SYSTEM_CALL.loadFoldersBy &&
      (method !== SYSTEM_CALL.loadFilesBy ||
        (method === SYSTEM_CALL.loadFilesBy &&
          (params as RequestType[SYSTEM_CALL.loadFilesBy]).fileIds)) &&
      !this?.isConnected
    ) {
      throw new Error("Please connect wallet first");
    }

    const res = await request();

    if (method === SYSTEM_CALL.createCapability) {
      this.appId = (params as RequestType[SYSTEM_CALL.createCapability]).appId;
    }

    return res as ReturnType[SYSTEM_CALL];
  }

  getCurrentPkh(): string {
    if (!this.address) {
      throw new Error("Please connect wallet first");
    }
    return `did:pkh:eip155:1:${this.address}`;
  }
}
