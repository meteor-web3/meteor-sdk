export enum FolderType {
  PublicFolderType,
  PrivateFolderType,
  UnionFolderType
}

export enum FileType {
  PublicFileType,
  PrivateFileType,
  PayableFileType
}

export enum SignalType {
  schema,
  action,
  asset
}

export enum StorageResource {
  CERAMIC = "CERAMIC",
  IPFS = "IPFS"
}

export enum ActionType {
  LIKE = "LIKE",
  COMMENT = "COMMENT",
  CLICK = "CLICK",
  UNLOCK = "UNLOCK",
  RECEIVE = "RECEIVE"
}

export enum StorageProviderName {
  Dataverse,
  Web3Storage,
  Lighthouse
}
