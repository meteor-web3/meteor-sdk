export enum SYSTEM_CALL {
  getPKP = "getPKP",
  executeLitAction = "executeLitAction",

  getValidAppCaps = "getValidAppCaps",
  getModelBaseInfo = "getModelBaseInfo",

  createCapability = "createCapability",
  checkCapability = "checkCapability",
  getAppSessionKey = "getAppSessionKey",
  getAppCacao = "getAppCacao",
  signWithSessionKey = "signWithSessionKey",

  generateFileKey = "generateFileKey",
  encryptContent = "encryptContent",

  createFolder = "createFolder",
  updateFolderBaseInfo = "updateFolderBaseInfo",
  loadFolderTrees = "loadFolderTrees",
  loadFoldersBy = "loadFoldersBy",
  deleteFolder = "deleteFolder",

  createIndexFile = "createIndexFile",
  updateIndexFile = "updateIndexFile",
  createActionFile = "createActionFile",
  updateActionFile = "updateActionFile",
  createBareFile = "createBareFile",
  updateBareFile = "updateBareFile",
  moveFiles = "moveFiles",
  removeFiles = "removeFiles",

  loadFile = "loadFile",
  loadFilesBy = "loadFilesBy",
  loadBareFileContent = "loadBareFileContent",
  loadActionFilesByFileId = "loadActionFilesByFileId",

  monetizeFile = "monetizeFile",
  monetizeFolder = "monetizeFolder",
  unlockFile = "unlockFile",
  isFileUnlocked = "isFileUnlocked"
}
