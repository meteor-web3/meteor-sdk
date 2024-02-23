import { DappTableClient, Dapp } from "@dataverse/dapp-table";
import { IPFS, baseURL } from "@meteor-web3/utils";
import axios from "axios";

import {
  RequestType,
  SYSTEM_CALL,
  ReturnType,
  Chain,
  WALLET,
  Provider,
  AuthType
} from "./types";
import { BaseProvider } from "./provider/base";
import { Model } from "./types/app/types";

export class Connector {
  protected dappTableClient?: DappTableClient;
  protected provider?: BaseProvider;

  constructor(provider?: BaseProvider) {
    this.dappTableClient = new DappTableClient();
    this.provider = provider;
  }

  get isConnected() {
    return this.provider?.isConnected;
  }

  get wallet() {
    return this.provider?.wallet;
  }

  get address() {
    return this.provider?.address;
  }

  get chain() {
    return this.provider?.chain;
  }

  get appId() {
    return this.provider?.appId;
  }

  get userInfo() {
    return this.provider?.userInfo;
  }

  getProvider(): BaseProvider {
    return this.provider;
  }

  /**
   * Warning: this method will destroy the previous provider and set a new provider
   */
  setProvider(provider: BaseProvider) {
    if (this.provider !== provider) {
      this.provider?.destroy?.();
      this.provider = provider;
    }
  }

  destroy() {
    this.provider?.destroy?.();
  }

  async connectWallet(params?: {
    wallet?: WALLET | undefined;
    preferredAuthType?: AuthType;
    provider?: Provider;
  }): Promise<{
    address: string;
    chain: Chain;
    wallet: WALLET;
    userInfo?: any;
  }> {
    if (!this.provider) {
      throw "Base Provider is not set. Please set the provider before calling this method.";
    }
    return this.provider.connectWallet(params);
  }

  async getCurrentWallet(): Promise<
    | {
        address: string;
        chain: Chain;
        wallet: WALLET;
      }
    | undefined
  > {
    if (!this.provider) {
      throw "Base Provider is not set. Please set the provider before calling this method.";
    }
    return this.provider.getCurrentWallet();
  }

  getCurrentPkh(): string {
    if (!this.provider) {
      throw "Base Provider is not set. Please set the provider before calling this method.";
    }
    return this.provider.getCurrentPkh();
  }

  async runOS<T extends SYSTEM_CALL>({
    method,
    params
  }: {
    method: T;
    params?: RequestType[T];
  }): Promise<Awaited<ReturnType[T]>> {
    if (!this.provider) {
      throw "Base Provider is not set. Please set the provider before calling this method.";
    }
    return this.provider.runOS({ method, params });
  }

  async getUserStorageSpaceSize() {
    const ipfs = new IPFS();
    const requestPath = "/v0/block_sum";
    const codeRes = await axios.post(`${baseURL}/v0/code`);
    const sigObj = await this.runOS({
      method: SYSTEM_CALL.signWithSessionKey,
      params: {
        code: codeRes.data.code,
        requestPath
      }
    });
    const res = await ipfs.getUserStorageSpaceSize(sigObj);
    return res;
  }

  getDAppTable() {
    return this.dappTableClient.getDapps();
  }

  getDAppInfo({
    dappId,
    modelId,
    hostname
  }: {
    dappId?: string;
    modelId?: string;
    hostname?: string;
  }) {
    return this.dappTableClient.getDapp({ dappId, modelId, hostname });
  }

  getLatestStream(model: Model) {
    return this.dappTableClient.getLatestStream(model);
  }

  getModelIdByAppIdAndModelName({
    dapp,
    modelName
  }: {
    dapp: Dapp;
    modelName: string;
  }): string | undefined {
    return this.dappTableClient.getModelIdByAppIdAndModelName({
      dapp,
      modelName
    });
  }
}
