import { Communicator } from "@meteor-web3/communicator";
import {
  convertTxData,
  formatSendTransactionData,
  detectMeteorExtension,
  ExternalWallet
} from "@meteor-web3/utils";
import {
  RequestType,
  SYSTEM_CALL,
  ReturnType,
  Chain,
  WALLET,
  Extension,
  Provider,
  AuthType
} from "../types";
import { MeteorBaseProvider } from "./meteorBase";
import EventEmitter from "eventemitter3";
import { ConnecterEvents } from "./types";
import { ethers, Bytes, Contract } from "ethers";
import { Deferrable } from "ethers/lib/utils";
import {
  TypedDataDomain,
  TypedDataField
} from "@ethersproject/abstract-signer";
import {
  TransactionRequest,
  TransactionResponse
} from "@ethersproject/providers";

export class WalletProvider extends EventEmitter<ConnecterEvents> {
  private signer: ethers.providers.JsonRpcSigner;
  isMeteor = true;
  isConnected?: boolean;
  address?: string;
  chain?: {
    chainId: number;
    chainName: string;
  };
  wallet?: string;
  userInfo?: any;

  constructor() {
    super();
    if (!window.externalWallet) {
      window.externalWallet = new ExternalWallet();
    }
    window.externalWallet.setProvider(window.meteorExternalProvider);

    if (!window.meteorCommunicator) {
      window.meteorCommunicator = new Communicator({
        source: window,
        target: window.top,
        methodClass: window.externalWallet
      });
    }
  }

  destroy() {
    window.meteorCommunicator?.destroy?.();
    window.externalWallet = undefined;
  }

  async connectWallet(params?: {
    wallet?: string;
    preferredAuthType?: string;
  }) {
    const res = await window.meteor.connectWallet(params);
    this.address = res.address;
    this.chain = res.chain;
    this.wallet = res.wallet;
    this.userInfo = res.userInfo;
    const provider = new ethers.providers.Web3Provider(this, "any");
    this.signer = provider.getSigner();
    return res;
  }

  async getCurrentWallet() {
    return window.meteor.getCurrentWallet();
  }

  getAddress() {
    return this.address;
  }

  async signMessage(message: Bytes | string): Promise<string> {
    if (!this.signer) {
      await this.connectWallet();
    }
    return this.signer.signMessage(message);
  }

  async _signTypedData(
    domain: TypedDataDomain,
    types: Record<string, Array<TypedDataField>>,
    message: Record<string, Array<TypedDataField> | string>
  ): Promise<string> {
    if (!this.signer) {
      await this.connectWallet();
    }
    return this.signer._signTypedData(domain, types, message);
  }

  async sendTransaction(
    transaction: Deferrable<TransactionRequest> | (string | Promise<string>)
  ): Promise<TransactionResponse> {
    if (!this.signer) {
      await this.connectWallet();
    }
    if (transaction && typeof transaction === "object") {
      transaction = transaction as TransactionRequest;
      if (!transaction?.from) {
        const res = await window.meteor.request({
          method: "eth_accounts",
          params: []
        });
        transaction.from = res[0];
      }
      Object.entries(transaction).forEach(([key, value]) => {
        if (key !== "from" && key !== "to") {
          if (formatSendTransactionData(value)) {
            transaction[key] = formatSendTransactionData(value);
          } else {
            delete transaction[key];
          }
        }
      });
      return this.signer.sendTransaction(transaction);
    } else {
      return window.meteor.request({
        method: "eth_sendTransaction",
        params: [transaction]
      });
    }
  }

  async contractCall({
    contractAddress,
    abi,
    method,
    params
  }: {
    contractAddress: string;
    abi: any[];
    method: string;
    params?: any[];
  }): Promise<any> {
    if (!this.signer) {
      await this.connectWallet();
    }
    const contract = new Contract(contractAddress, abi, this.signer);
    const tx = await (params
      ? contract[method](...params)
      : contract[method]());
    if (tx && typeof tx === "object" && tx.wait) {
      let res = await tx.wait();
      res = convertTxData(res);
      return res;
    }
    return tx;
  }

  on(event: string, listener: Function) {
    window.meteor.on(event, listener);
    return this;
  }

  off(event: string, listener?: Function) {
    window.meteor.off(event, listener);
    return this;
  }

  request({ method, params }: { method: string; params?: Array<any> }) {
    return window.meteor.request({ method, params });
  }
}

export class MeteorWalletProvider extends MeteorBaseProvider {
  private communicator: Communicator;
  private meteorProvider?: WalletProvider;
  private externalProvider?: any;
  private externalWallet: ExternalWallet;

  constructor() {
    super();
    if (!window.externalWallet) {
      window.externalWallet = new ExternalWallet();
    }
    this.externalWallet = window.externalWallet;
    if (!window.meteorCommunicator || window.meteorCommunicator.isDestroyed) {
      this.communicator = new Communicator({
        source: window,
        target: window.top,
        methodClass: this.externalWallet
      });
      window.meteorCommunicator = this.communicator;
    } else {
      this.communicator = window.meteorCommunicator;
    }
    this.communicator.onRequestMessage(() => {});
  }

  destroy(): void {
    if (this.destroyed) return;
    this.meteorProvider.destroy();
    window.externalWallet = undefined;
    this.destroyed = true;
  }

  connectWallet = async (params?: {
    wallet?: WALLET | undefined;
    preferredAuthType?: AuthType;
    provider?: Provider;
  }): Promise<{
    address: string;
    chain: Chain;
    wallet: WALLET;
    userInfo?: any;
  }> => {
    let wallet: WALLET;
    let provider: Provider;
    let preferredAuthType: AuthType;
    if (params) {
      wallet = params.wallet;
      provider = params.provider || window.meteor;
      preferredAuthType = params.preferredAuthType;
    } else {
      provider = window.meteor;
    }

    if (provider.isMeteor) {
      if (!(await detectMeteorExtension())) {
        throw "The plugin has not been loaded yet. Please check the plugin status or go to https://chrome.google.com/webstore/detail/meteor/kcigpjcafekokoclamfendmaapcljead to install plugins";
      }
      if (wallet === WALLET.EXTERNAL_WALLET) {
        throw "Conflict between wallet and provider";
      }

      this.communicator.onRequestMessage(() => {});

      const meteorProvider = new WalletProvider();
      const res = await meteorProvider.connectWallet({
        wallet: wallet || provider.wallet,
        preferredAuthType
      });

      if (
        !this.isConnected ||
        (this.externalProvider && !this.meteorProvider)
      ) {
        meteorProvider.on("chainChanged", (chainId: number) => {
          this.chain.chainId = chainId;
        });
        meteorProvider.on("chainNameChanged", (chainName: string) => {
          this.chain.chainName = chainName;
        });
        meteorProvider.on("accountsChanged", (accounts: string[]) => {
          this.address = accounts[0];
        });
      }

      this.isConnected = true;
      this.wallet = res.wallet as WALLET;
      this.address = res.address;
      this.chain = res.chain;
      this.userInfo = res.userInfo;
      this._provider = meteorProvider;
      this.meteorProvider = meteorProvider;

      return {
        wallet: this.wallet,
        address: this.address,
        chain: this.chain,
        userInfo: this.userInfo
      };
    }

    this.externalProvider = provider;
    window.meteorExternalProvider = provider;
    this.externalWallet.setProvider(provider);
    this.communicator.onRequestMessage(undefined);

    const meteorProvider = new WalletProvider();
    const res = await meteorProvider.connectWallet({
      wallet: WALLET.EXTERNAL_WALLET
    });

    this.externalProvider.removeAllListeners("chainChanged");
    this.externalProvider.removeAllListeners("accountsChanged");
    this.externalProvider.on("chainChanged", (networkId: string) => {
      const chainId = Number(networkId);
      this.chain.chainId = chainId;
      this.chain.chainName =
        chainId === 80001 ? "mumbai" : chainId === 1 ? "ethereum" : "Unknown";
      window.meteorCommunicator?.sendRequest({
        method: "chainChanged",
        params: {
          chain: { chainId: Number(networkId), chainName: "Unknown" },
          wallet: this.wallet
        },
        postMessageTo: "Browser"
      });
    });
    this.externalProvider.on("accountsChanged", (accounts: string[]) => {
      this.address = ethers.utils.getAddress(accounts[0]);
      window.meteorCommunicator?.sendRequest({
        method: "accountsChanged",
        params: {
          accounts: accounts.map((account) => ethers.utils.getAddress(account)),
          wallet: this.wallet
        },
        postMessageTo: "Browser"
      });
    });

    this.isConnected = true;
    this.wallet = res.wallet as WALLET;
    this.address = res.address;
    this.chain = res.chain;
    this.userInfo = res.userInfo;
    this._provider = this.externalProvider;

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
    return window.meteor.getCurrentWallet();
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

    const res = (await this.communicator.sendRequest({
      method,
      params,
      postMessageTo: Extension
    })) as ReturnType[SYSTEM_CALL];

    if (method === SYSTEM_CALL.createCapability) {
      this.appId = (params as RequestType[SYSTEM_CALL.createCapability]).appId;
    }

    return res;
  };
}
