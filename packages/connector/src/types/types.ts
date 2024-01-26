import { WalletProvider } from "../provider/meteorWallet";
import { StorageProviderName } from "./constants";

export interface StorageProvider {
  name: StorageProviderName;
  apiKey: string;
}

export type Provider = Window["meteor"] | WalletProvider | any;
