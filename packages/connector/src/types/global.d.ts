import { WALLET } from ".";
import { Communicator } from "@meteor-web3/communicator";
import { ExternalWallet } from "@meteor-web3/utils";

declare global {
  interface Window {
    meteor: {
      isMeteor: boolean;
      connectWallet: (
        params:
          | {
              wallet?: string;
              preferredAuthType?: string;
            }
          | undefined
      ) => Promise<{
        address: string;
        chain: { chainId: number; chainName: string };
        wallet: string;
        userInfo?: any;
      }>;
      getCurrentWallet: () => Promise<{
        address: string;
        chain: { chainId: number; chainName: string };
        wallet: WALLET;
      }>;
      request: ({
        method,
        params
      }: {
        method: string;
        params?: Array<any>;
      }) => Promise<any>;
      on: (event: string, listener: Function) => void;
      off: (event: string, listener?: Function) => void;
      sign: ({
        method,
        params
      }: {
        method: string;
        params: Array<any>;
      }) => Promise<string>;
    };
    externalWallet: ExternalWallet;
    meteorExternalProvider: any;
    meteorCommunicator: Communicator;
  }
}
