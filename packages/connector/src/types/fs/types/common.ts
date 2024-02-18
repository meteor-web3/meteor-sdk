import { ReturnType, SYSTEM_CALL } from "../../system-call";
import { StorageProviderName } from "../constants";

export type FileContent = Record<string, any>;

export type FileRecord = Awaited<ReturnType[SYSTEM_CALL.loadFile]>;

export interface StorageProvider {
  name: StorageProviderName;
  apiKey?: string;
}
