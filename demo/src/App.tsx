import React, { useEffect, useState } from "react";
import {
  Connector,
  StructuredFolderRecord,
  StorageProviderName,
  WALLET,
  RESOURCE,
  SYSTEM_CALL,
  ActionType,
  // StorageResource,
  WalletProvider,
  MeteorWalletProvider
} from "@meteor-web3/connector";
import { Contract, ethers } from "ethers";
import { assert } from "chai";
import { Modal } from "antd";
import "./App.scss";

const connector = new Connector(new MeteorWalletProvider());

export const appId = "9aaae63f-3445-47d5-8785-c23dd16e4965";

const postModelId =
  "kjzl6hvfrbw6c8h0oiiv2ccikb2thxsu98sy0ydi6oshj6sjuz9dga94463anvf";

// const actionFileModelId =
//   "kjzl6hvfrbw6c9g4ui7z1jksvbk7y09q6c1ruyqiij0otmvzr7oy3vd0yg43qzw";

const postVersion = "0.0.1";

const storageProvider = {
  name: StorageProviderName.Dataverse
  // apiKey: "9d632fe6.e756cc9797c345dc85595a688017b226" // input your api key to call createBareFile successfully
};

let address: string;
let wallet: WALLET;
let pkh: string;

let keyHandler: string;
let encryptedContent: Record<string, any>;

let folders: StructuredFolderRecord;
let folderId: string;

let dataUnionId: string;

let indexFileId: string;
let actionFileId: string;

function App() {
  const [_address, _setAddress] = useState("");
  // const [wallet, setWallet] = useState<WALLET>();
  const [_pkh, _setPkh] = useState("");
  const [_currentPkh, _setCurrentPkh] = useState("");
  // let currentPkh: string | undefined;
  const [pkpWallet, setPKPWallet] = useState({
    address: "",
    publicKey: ""
  });
  const [litActionResponse, setLitActionResponse] = useState("");

  const [isCurrentPkhValid, setIsCurrentPkhValid] = useState<boolean>();
  const [appListInfo, setAppListInfo] = useState<string>("");
  const [appInfo, setAppInfo] = useState<string>("");

  // const [folders, setFolders] = useState<StructuredFolderRecord>();
  // const [folderId, setFolderId] = useState("");
  // const [dataUnions, setDataUnions] = useState<StructuredFolderRecord>();
  // const [dataUnionId, setDataUnionId] = useState("");
  // const [indexFileId, setIndexFileId] = useState("");
  // const [actionFileId, setActionFileId] = useState("");

  const [meteorWalletSDKHasAddedListener, setMeteorWalletSDKHasAddedListener] =
    useState<boolean>();
  const [mochaRunner, setMochaRunner] = useState<Mocha.Runner>();
  const [mochaSuites, setMochaSuites] = useState<Mocha.Suite[]>();
  const [showMoreTests, setShowMoreTests] = useState<boolean>(false);
  const [provider, setProvider] = useState<WalletProvider>();
  const [isInit, setIsInit] = useState<boolean>(false);

  // setup mocha
  useEffect(() => {
    mocha.setup({
      ui: "bdd",
      asyncOnly: true
    });
  }, []);

  const handleRunTests = async (suites: Mocha.Suite[]) => {
    // clean up tests
    if (mochaSuites) {
      mochaSuites.forEach((suite) => {
        suite.tests = [];
      });
    }
    // define tests
    // const dappSuite = defineDappTests();
    setMochaSuites(suites);
    // run tests
    if (!mochaRunner) {
      setMochaRunner(mocha.run());
    } else {
      mochaRunner.run();
    }
  };

  const init = async () => {
    console.log("connecting meteor wallet...");
    const connectResult = await connectWalletWithMetamaskProvider();
    assert.isDefined(connectResult, "connect wallet failed");
    console.log("creating capability...");
    const pkh = await createCapability();
    assert.isString(pkh, "createCapability failed");
    const checked = await checkCapability();
    assert.isTrue(checked, "checkCapability failed");
    setIsInit(true);
  };

  const defineInitTests = () => {
    return describe("Init", function () {
      // set no timeout
      this.timeout(0);

      it("Init", async () => {
        await init();
      });
    });
  };

  const defineDappTests = () => {
    return describe("DApp", function () {
      // set no timeout
      this.timeout(0);

      before(async () => {
        if (!isInit) {
          await init();
        }
      });

      it("getDAppTable", async () => {
        const dappTable = await getDAppTable();
        assert(dappTable && dappTable.length > 0, "getDAppTable failed");
      });

      it("getDAppInfo", async () => {
        const dappInfo = await getDAppInfo();
        assert.isObject(dappInfo, "getDAppInfo failed");
      });

      it("getValidAppCaps", async () => {
        const validAppCaps = await getValidAppCaps();
        assert(
          validAppCaps && validAppCaps.length > 0,
          "getValidAppCaps failed"
        );
      });

      it("getModelBaseInfo", async () => {
        const modelInfo = await getModelBaseInfo();
        assert.isObject(modelInfo, "getModelBaseInfo failed");
      });
    });
  };

  const defineFolderTests = () => {
    return describe("Folder", function () {
      // set no timeout
      this.timeout(0);

      before(async () => {
        if (!isInit) {
          await init();
        }
      });

      it("loadFolderTrees", loadFolderTrees);

      it("createFolder", createFolder);

      it("updateFolderBaseInfo", updateFolderBaseInfo);

      it("loadFoldersBy", loadFoldersBy);

      it("getDefaultFolderId", getDefaultFolderId);

      it("deleteFolder", deleteFolder);
    });
  };

  const defineFileTests = () => {
    return describe("File", function () {
      // set no timeout
      this.timeout(0);

      before(async () => {
        if (!isInit) {
          await init();
        }
      });

      it("createFolder", createFolder);

      it("createIndexFile", createIndexFile);

      it("updateIndexFile", updateIndexFile);

      it("loadFile", loadFile);

      it("loadFilesBy", loadFilesBy);

      it("createActionFile", createActionFile);

      it("updateActionFile", updateActionFile);

      it("createBareFile", async () => {
        return new Promise((resolve, reject) => {
          try {
            const inputDom = document.createElement("input");
            inputDom.type = "file";
            inputDom.onchange = (e) =>
              createBareFile(e).then(resolve).catch(reject);
            // Warning: File chooser dialog can only be shown with a user activation
            // ref: https://github.com/lostvita/blog/issues/32
            Modal.confirm({
              title: "Please click 'OK' to upload a file",
              onOk: () => inputDom.click(),
              onCancel: () => reject("cancel")
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      it("updateBareFile", async () => {
        return new Promise((resolve, reject) => {
          try {
            const inputDom = document.createElement("input");
            inputDom.type = "file";
            inputDom.onchange = (e) =>
              updateBareFile(e).then(resolve).catch(reject);
            // Warning: File chooser dialog can only be shown with a user activation
            // ref: https://github.com/lostvita/blog/issues/32
            Modal.confirm({
              title: "Please click 'OK' to upload a file",
              onOk: () => inputDom.click(),
              onCancel: () => reject("cancel")
            });
          } catch (e) {
            reject(e);
          }
        });
      });

      it("loadBareFileContent", loadBareFileContent);

      it("moveFiles", moveFiles);

      it("removeFiles", removeFiles);
    });
  };

  // const defineUnionTests = () => {
  //   return describe("Union", function () {
  //     // set no timeout
  //     this.timeout(0);

  //     before(async () => {
  //       if (!isInit) {
  //         await init();
  //       }
  //     });

  //     it("publishDataUnion", publishDataUnion);

  //     it("updateDataUnionBaseInfo", updateDataUnionBaseInfo);

  //     it("loadCreatedDataUnions", loadCreatedDataUnions);

  //     it("loadCollectedDataUnions", loadCollectedDataUnions);

  //     it("loadDataUnionById", loadDataUnionById);

  //     it("deleteDataUnion", deleteDataUnion);
  //   });
  // };

  /*** Wallet ***/
  const connectWalletWithMeteorWalletSDK = async (_wallet = wallet) => {
    const provider = new WalletProvider();
    console.log(provider);
    const res = await connector.connectWallet({
      ...(_wallet !== WALLET.EXTERNAL_WALLET && {
        wallet: _wallet,
        preferredAuthType: "twitter"
      }),
      provider
    });
    console.log(res);
    setProvider(provider);
    wallet = res.wallet;
    address = res.address;
    _setAddress(address);
    if (!meteorWalletSDKHasAddedListener) {
      provider.on("chainChanged", (chainId: number) => {
        console.log(chainId);
      });
      provider.on("chainNameChanged", (chainName: string) => {
        console.log(chainName);
      });
      provider.on("accountsChanged", (accounts: Array<string>) => {
        console.log(accounts);
        address = accounts[0];
        _setAddress(address);
      });
      setMeteorWalletSDKHasAddedListener(true);
    }
    return res;
  };

  const connectWalletWithMetamaskProvider = async (_wallet = wallet) => {
    const provider = (window as any).ethereum;
    console.log(provider);
    const res = await connector.connectWallet({
      wallet: _wallet,
      provider
    });
    console.log(res);
    setProvider(provider);
    wallet = WALLET.EXTERNAL_WALLET;
    address = res.address;
    _setAddress(address);
    provider.on("chainChanged", (networkId: string) => {
      console.log(Number(networkId));
    });
    provider.on("accountsChanged", (accounts: Array<string>) => {
      console.log(accounts);
      address = ethers.utils.getAddress(accounts[0]);
      _setAddress(address);
    });
    return res;
  };

  const getCurrentWallet = async () => {
    const res = await connector.getCurrentWallet();
    if (res) {
      if (res.wallet !== WALLET.EXTERNAL_WALLET) {
        await connectWalletWithMeteorWalletSDK(res.wallet);
      } else {
        await connectWalletWithMetamaskProvider(res.wallet);
      }
    } else {
      console.log(res);
    }
    return res;
  };

  const switchNetwork = async () => {
    if (!connector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }]
    });
  };

  const signOrSignTypedData = async () => {
    if (!connector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    const res = await provider?.request({
      method: "personal_sign",
      params: [address, "test"]
    });

    console.log(res);

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }]
    });

    const res2 = await provider?.request({
      method: "eth_signTypedData_v4",
      params: [
        address,
        JSON.stringify({
          domain: {
            name: "EPNS COMM V1",
            chainId: 80001,
            verifyingContract: "0xb3971BCef2D791bc4027BbfedFb47319A4AAaaAa"
          },
          primaryType: "Data",
          types: {
            Data: [
              {
                name: "data",
                type: "string"
              }
            ],
            EIP712Domain: [
              {
                name: "name",
                type: "string"
              },
              {
                name: "chainId",
                type: "uint256"
              },
              {
                name: "verifyingContract",
                type: "address"
              }
            ]
          },
          message: {
            data: '2+{"notification":{"title":"Push Title Hello","body":"Good to see you bodies"},"data":{"acta":"","aimg":"","amsg":"Payload Push Title Hello Body","asub":"Payload Push Title Hello","type":"1"},"recipients":"eip155:5:0x6ed14ee482d3C4764C533f56B90360b767d21D5E"}'
          }
        })
      ]
    });

    console.log(res2);
  };

  const sendTransaction = async () => {
    if (!connector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }
    const res = await provider?.request({
      method: "eth_sendTransaction",
      params: [
        {
          from: connector.address, // The user's active address.
          to: connector.address, // Required except during contract publications.
          value: "0xE8D4A50FFD41E" // Only required to send ether to the recipient from the initiating external account.
          // gasPrice: "0x09184e72a000", // Customizable by the user during MetaMask confirmation.
          // gas: "0x2710", // Customizable by the user during MetaMask confirmation.
        }
      ]
    });

    console.log(res);

    // const ethersProvider = new ethers.providers.Web3Provider(provider!);

    // const ethersSigner = ethersProvider.getSigner();
    // const res = await ethersSigner.sendTransaction({
    //   from: connector.address, // The user's active address.
    //   to: connector.address, // Required except during contract publications.
    //   value: "0xE8D4A50FFD41E", // Only required to send ether to the recipient from the initiating external account.
    //   // gasPrice: "0x09184e72a000", // Customizable by the user during MetaMask confirmation.
    //   // gas: "0x2710", // Customizable by the user during MetaMask confirmation.
    // });
    // const tx = await res.wait();
    // console.log(tx);
  };

  const contractCall = async () => {
    if (!connector?.isConnected) {
      console.error("please connect wallet first");
      return;
    }

    await provider?.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: "0x13881" }]
    });

    const contractAddress = "0x2e43c080B56c644F548610f45998399d42e3d400";

    const abi = [
      {
        inputs: [],
        stateMutability: "nonpayable",
        type: "constructor"
      },
      {
        inputs: [
          {
            internalType: "uint256",
            name: "value_",
            type: "uint256"
          }
        ],
        name: "setValue",
        outputs: [],
        stateMutability: "nonpayable",
        type: "function"
      },
      {
        inputs: [],
        name: "value",
        outputs: [
          {
            internalType: "uint256",
            name: "",
            type: "uint256"
          }
        ],
        stateMutability: "view",
        type: "function"
      }
    ];

    const ethersProvider = new ethers.providers.Web3Provider(provider!);

    const ethersSigner = ethersProvider.getSigner();

    const contract = new Contract(contractAddress, abi, ethersSigner);

    const res = await contract.setValue(12345);
    console.log(res);

    const tx = await res.wait();
    console.log(tx);

    const value = await contract.value();
    console.log(value);

    return tx;
  };

  const getCurrentPkh = async () => {
    const res = connector.getCurrentPkh();
    console.log(res);
    _setCurrentPkh(res);
  };

  const getPKP = async () => {
    const res = await connector.runOS({ method: SYSTEM_CALL.getPKP });
    console.log(res);
    setPKPWallet(res);
  };

  const executeLitAction = async () => {
    //   const LIT_ACTION_CALL_CODE = `(async () => {
    //     const latestNonce = await Lit.Actions.getLatestNonce({ address, chain });
    //     Lit.Actions.setResponse({response: JSON.stringify({latestNonce})});
    // })();`;
    //   const executeJsArgs = {
    //     code: LIT_ACTION_CALL_CODE,
    //     jsParams: {
    //       address: pkpWallet.address,
    //       chain: "mumbai",
    //     },
    //   };
    //   const res = await connector.executeLitAction(executeJsArgs);
    //   console.log(res);
    //   setLitActionResponse(JSON.stringify(res));

    const LIT_ACTION_SIGN_CODE = `(async () => {
        const sigShare = await Lit.Actions.signEcdsa({ toSign, publicKey , sigName });
        Lit.Actions.setResponse({response: JSON.stringify({sigShare})});
    })();`;
    const executeJsArgs = {
      code: LIT_ACTION_SIGN_CODE,
      jsParams: {
        toSign: [72, 101, 108, 108, 111, 32, 87, 111, 114, 108, 100],
        publicKey: pkpWallet.publicKey,
        sigName: "sig1"
      }
    };
    const res = await connector.runOS({
      method: SYSTEM_CALL.executeLitAction,
      params: executeJsArgs
    });
    console.log(res);
    setLitActionResponse(JSON.stringify(res));
  };
  /*** Wallet ***/

  /*** DApp ***/
  const getDAppTable = async () => {
    const appsInfo = await connector.getDAppTable();
    console.log(appsInfo);
    setAppListInfo(`${appsInfo.length} results show in console.`);
    return appsInfo;
  };

  const getDAppInfo = async () => {
    const appInfo = await connector.getDAppInfo({ dappId: appId });
    console.log(appInfo);
    setAppInfo(`1 result show in console.`);
    return appInfo;
  };

  const getValidAppCaps = async () => {
    const appsInfo = await connector.runOS({
      method: SYSTEM_CALL.getValidAppCaps
    });
    console.log(appsInfo);
    return appsInfo;
  };

  const getModelBaseInfo = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.getModelBaseInfo,
      params: postModelId
    });
    console.log(res);
    return res;
  };
  /*** DApp ***/

  /*** Capability ***/
  const createCapability = async () => {
    // await connectWalletWithMetamaskProvider();
    const res = await connector.runOS({
      method: SYSTEM_CALL.createCapability,
      params: {
        appId,
        resource: RESOURCE.CERAMIC
      }
    });
    pkh = res.pkh;
    const cacao = res.cacao;
    _setPkh(pkh);
    console.log(pkh);
    console.log(cacao);
    return pkh;
  };

  const checkCapability = async () => {
    const isCurrentPkhValid = await connector.runOS({
      method: SYSTEM_CALL.checkCapability,
      params: {
        appId
      }
    });
    console.log(isCurrentPkhValid);
    setIsCurrentPkhValid(isCurrentPkhValid);
    return isCurrentPkhValid;
  };

  const getAppSessionKey = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.getAppSessionKey
    });
    console.log(res);
  };

  const getAppCacao = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.getAppCacao
    });
    console.log(res);
  };

  const signWithSessionKey = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.signWithSessionKey,
      params: "test"
    });
    console.log(res);
  };

  const getUserStorageSpace = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.getUserStorageSpace
    });
    console.log(res);
  };

  /*** Capability ***/

  /*** Encryption ***/
  const generateFileKey = async () => {
    keyHandler = await connector.runOS({
      method: SYSTEM_CALL.generateFileKey
    });
    console.log(keyHandler);
  };

  const encryptContent = async () => {
    encryptedContent = await connector.runOS({
      method: SYSTEM_CALL.encryptContent,
      params: {
        content: {
          text: "hi",
          images: [
            "https://gateway.lighthouse.storage/ipfs/QmPrjqTSMCWpsw52XJjqx6TKRMW8HdjNYir2VKC48TAHy8"
          ]
        },
        keyHandler
      }
    });
    console.log(encryptedContent);
  };
  /*** Encryption ***/

  /*** Folders ***/
  const createFolder = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.createFolder,
      params: {
        folderName: "Private"
      }
    });
    console.log(res);
    folderId = res.newFolder.folderId;
    console.log(res.newFolder.folderId);
  };

  const updateFolderBaseInfo = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.updateFolderBaseInfo,
      params: {
        folderId: folderId!,
        folderName: new Date().toISOString(),
        folderDescription: new Date().toISOString()
      }
    });
    console.log(res);
  };

  const loadFolderTrees = async () => {
    const _folders = await connector.runOS({
      method: SYSTEM_CALL.loadFolderTrees
    });
    folders = _folders;
    console.log({ folders });
    return folders;
  };

  const loadFoldersBy = async () => {
    const folders = await connector.runOS({
      method: SYSTEM_CALL.loadFoldersBy,
      params: {
        folderIds: [folderId]
      }
    });
    console.log({ folders });
    return folders;
  };

  const getDefaultFolderId = async () => {
    if (!folders) {
      folders = await loadFolderTrees();
    }
    const { defaultFolderName } = await getDAppInfo();
    const folder = Object.values(folders).find(
      (folder) => folder.folderName === defaultFolderName
    );
    return folder!.folderId;
  };

  const deleteFolder = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.deleteFolder,
      params: {
        folderId: folderId!
      }
    });
    console.log(res);
  };

  const deleteAllFolders = async () => {
    if (!folders) {
      folders = await loadFolderTrees();
    }
    await Promise.all(
      Object.keys(folders).map((folderId) =>
        connector.runOS({
          method: SYSTEM_CALL.deleteFolder,
          params: { folderId }
        })
      )
    );
  };

  /*** Folders ***/

  /*** Files ***/
  const createIndexFile = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: false,
      images: false,
      videos: false
    });

    const res = await connector.runOS({
      method: SYSTEM_CALL.createIndexFile,
      params: {
        modelId: postModelId,
        fileName: "create a file",
        fileContent: {
          modelVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link"
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted
        },
        encryptedContent,
        keyHandler
      }
    });

    indexFileId = res.fileContent.file.fileId;
    console.log(res);
  };

  const updateIndexFile = async () => {
    const date = new Date().toISOString();

    const encrypted = JSON.stringify({
      text: true,
      images: true,
      videos: false
    });

    const res = await connector.runOS({
      method: SYSTEM_CALL.updateIndexFile,
      params: {
        fileId: indexFileId!,
        fileName: "update the file",
        fileContent: {
          modelVersion: postVersion,
          text: "hello",
          images: [
            "https://bafkreib76wz6wewtkfmp5rhm3ep6tf4xjixvzzyh64nbyge5yhjno24yl4.ipfs.w3s.link"
          ],
          videos: [],
          createdAt: date,
          updatedAt: date,
          encrypted
        },
        encryptedContent,
        keyHandler
      }
    });
    console.log(res);
  };

  const loadFile = async () => {
    const file = await connector.runOS({
      method: SYSTEM_CALL.loadFile,
      params: indexFileId
    });
    console.log(file);
    return file;
  };

  const loadFilesBy = async () => {
    const fileRecord = await connector.runOS({
      method: SYSTEM_CALL.loadFilesBy,
      params: {
        modelId: postModelId,
        pkh
      }
    });
    console.log(fileRecord);
  };

  const loadActionFilesByFileId = async () => {
    const fileRecord = await connector.runOS({
      method: SYSTEM_CALL.loadActionFilesByFileId,
      params: indexFileId
    });
    console.log(fileRecord);
  };

  const loadActionFilesByDataUnionId = async () => {
    const fileRecord = await connector.runOS({
      method: SYSTEM_CALL.loadActionFilesByDataUnionId,
      params: dataUnionId
    });
    console.log(fileRecord);
  };

  const createActionFile = async () => {
    if (!indexFileId) {
      throw "RelationId cannnot be empty";
    }
    const res = await connector.runOS({
      method: SYSTEM_CALL.createActionFile,
      params: {
        folderId,
        action: {
          actionType: ActionType.LIKE,
          comment: "I like it!",
          isRelationIdEncrypted: false,
          isCommentEncrypted: false
        },
        relationId: indexFileId,
        fileName: "like"
      }
    });
    actionFileId = res.newFile.fileId;
    console.log(res);
  };

  const updateActionFile = async () => {
    if (!indexFileId) {
      throw "RelationId cannnot be empty";
    }
    const res = await connector.runOS({
      method: SYSTEM_CALL.updateActionFile,
      params: {
        fileId: actionFileId!,
        isRelationIdEncrypted: true,
        isCommentEncrypted: true,
        fileName: "like"
      }
    });
    actionFileId = res.currentFile.fileId;
    console.log(res);
  };

  const createBareFile = async (event: any) => {
    try {
      const file = event.target.files[0];
      console.log(file);
      if (!file) {
        return;
      }
      const fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileBase64: string = await new Promise((resolve) => {
        reader.addEventListener("load", async (e: any) => {
          resolve(e.target.result);
        });
      });

      console.log(fileBase64);

      const res = await connector.runOS({
        method: SYSTEM_CALL.createBareFile,
        params: {
          folderId,
          fileBase64,
          fileName,
          encrypted: true,
          storageProvider
        }
      });
      console.log(res);
      indexFileId = res.newFile.fileId;
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const updateBareFile = async (event: any) => {
    try {
      const file = event.target.files[0];
      console.log(file);
      if (!file) {
        return;
      }
      const fileName = file.name;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      const fileBase64: string = await new Promise((resolve) => {
        reader.addEventListener("load", async (e: any) => {
          resolve(e.target.result);
        });
      });

      console.log(fileBase64);

      const res = await connector.runOS({
        method: SYSTEM_CALL.updateBareFile,
        params: {
          fileId: indexFileId!,
          fileBase64,
          fileName,
          encrypted: true,
          storageProvider
        }
      });
      indexFileId = res.currentFile.fileId;
      console.log(res);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };

  const loadBareFileContent = async () => {
    try {
      const res = await connector.runOS({
        method: SYSTEM_CALL.loadBareFileContent,
        params: indexFileId
      });
      console.log(res);
    } catch (error) {
      console.error(error);
    }
  };

  const moveFiles = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.moveFiles,
      params: {
        targetFolderId: folderId || (await getDefaultFolderId()),
        fileIds: [actionFileId! || indexFileId!]
      }
    });
    console.log(res);
  };

  const removeFiles = async () => {
    const res = await connector.runOS({
      method: SYSTEM_CALL.removeFiles,
      params: {
        fileIds: [actionFileId! || indexFileId!]
      }
    });
    console.log(res);
  };
  /*** Files ***/

  return (
    <div className='App'>
      <div id='mocha' />
      <div className='flex'>
        <button
          onClick={() =>
            handleRunTests([
              defineInitTests(),
              defineDappTests(),
              defineFolderTests(),
              defineFileTests()
              // defineUnionTests(),
            ])
          }
        >
          run all tests
        </button>
        <p className='link' onClick={() => setShowMoreTests((show) => !show)}>
          {showMoreTests ? "less" : "more"}
        </p>
      </div>
      <div className={showMoreTests ? "show" : "hidden"}>
        <button onClick={() => handleRunTests([defineInitTests()])}>
          run init tests
        </button>
        <button onClick={() => handleRunTests([defineDappTests()])}>
          run dapp tests
        </button>
        <button onClick={() => handleRunTests([defineFolderTests()])}>
          run folder tests
        </button>
        <button onClick={() => handleRunTests([defineFileTests()])}>
          run file tests
        </button>
        {/* <button onClick={() => handleRunTests([defineUnionTests()])}>
          run union tests
        </button> */}
      </div>
      <button onClick={() => connectWalletWithMeteorWalletSDK()}>
        connectWalletWithMeteorWalletSDK
      </button>
      <button onClick={() => connectWalletWithMetamaskProvider()}>
        connectWalletWithMetamaskProvider
      </button>
      <div className='blackText'>{_address}</div>
      <hr />
      <button onClick={getCurrentWallet}>getCurrentWallet</button>
      <hr />
      <button onClick={switchNetwork}>switchNetwork</button>
      <hr />
      <button onClick={signOrSignTypedData}>signOrSignTypedData</button>
      <hr />
      <button onClick={sendTransaction}>sendTransaction</button>
      <hr />
      <button onClick={contractCall}>contractCall</button>
      <hr />
      <button onClick={getCurrentPkh}>getCurrentPkh</button>
      <div className='blackText'>{_currentPkh}</div>
      <hr />
      <button onClick={getPKP}>getPKP</button>
      {pkpWallet.address && (
        <div className='blackText'>
          address: {pkpWallet.address} <br />
          publicKey: {pkpWallet.publicKey}
        </div>
      )}
      <hr />
      <button onClick={executeLitAction}>executeLitAction</button>
      <div className='blackText json'>{litActionResponse}</div>
      <hr />
      <br />
      <br />
      <button onClick={getDAppTable}>getDAppTable</button>
      {appListInfo}
      <hr />
      <button onClick={getDAppInfo}>getDAppInfo</button>
      {appInfo}
      <hr />
      <button onClick={getValidAppCaps}>getValidAppCaps</button>
      <button onClick={getModelBaseInfo}>getModelBaseInfo</button>
      <br />
      <br />
      <button onClick={createCapability}>createCapability</button>
      <div className='blackText'>{_pkh}</div>
      <hr />
      <button onClick={checkCapability}>checkCapability</button>
      <div className='blackText'>
        {isCurrentPkhValid !== undefined && String(isCurrentPkhValid)}
      </div>
      <button onClick={getAppSessionKey}>getAppSessionKey</button>
      <button onClick={getAppCacao}>getAppCacao</button>
      <button onClick={signWithSessionKey}>signWithSessionKey</button>
      <button onClick={getUserStorageSpace}>getUserStorageSpace</button>
      <br />
      <button onClick={generateFileKey}>generateFileKey</button>
      <button onClick={encryptContent}>encryptContent</button>
      <br />
      <br />
      <button onClick={createFolder}>createFolder</button>
      <button onClick={updateFolderBaseInfo}>updateFolderBaseInfo</button>
      <button onClick={loadFolderTrees}>loadFolderTrees</button>
      <button onClick={loadFoldersBy}>loadFoldersBy</button>
      <button onClick={deleteFolder}>deleteFolder</button>
      <button onClick={deleteAllFolders}>deleteAllFolders</button>
      <br />
      <br />
      <button onClick={createIndexFile}>createIndexFile</button>
      <button onClick={updateIndexFile}>updateIndexFile</button>
      <button onClick={loadFile}>loadFile</button>
      <button onClick={loadFilesBy}>loadFilesBy</button>
      <button onClick={createActionFile}>createActionFile</button>
      <button onClick={updateActionFile}>updateActionFile</button>
      <button onClick={loadActionFilesByFileId}>loadActionFilesByFileId</button>
      <button onClick={loadActionFilesByDataUnionId}>
        loadActionFilesByDataUnionId
      </button>
      <button>
        <span>createBareFile</span>
        <input
          type='file'
          onChange={createBareFile}
          name='createBareFile'
          style={{ width: "168px", marginLeft: "10px" }}
        />
      </button>
      <button>
        <span>updateBareFile</span>
        <input
          type='file'
          onChange={updateBareFile}
          name='updateBareFile'
          style={{ width: "168px", marginLeft: "10px" }}
        />
      </button>
      <button onClick={loadBareFileContent}>loadBareFileContent</button>
      <button onClick={moveFiles}>moveFiles</button>
      <button onClick={removeFiles}>removeFiles</button>
      <br />
      <br />
    </div>
  );
}

export default App;
