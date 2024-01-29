<br/>
<p align="center">
<a href=" " target="_blank">
<img src="https://avatars.githubusercontent.com/u/118692557?s=200&v=4" width="180" alt="Meteor logo">
</a >
</p >
<br/>

# connector

[![npm version](https://img.shields.io/npm/v/@meteor-web3/connector.svg)](https://www.npmjs.com/package/@meteor-web3/connector)
![npm](https://img.shields.io/npm/dw/@meteor-web3/connector)
[![License](https://img.shields.io/npm/l/@meteor-web3/connector.svg)](https://github.com/@meteor-web3/connector/blob/main/LICENSE.md)

The system calls exposed by Dataverse Kernel.

## Installation

```bash
pnpm install @meteor-web3/connector
```

## Run demo

### requirements

- [Meteor](https://chrome.google.com/webstore/detail/meteor/kcigpjcafekokoclamfendmaapcljead) -
  A secure data wallet to protect your identity and data assets.
- [MetaMask](https://chrome.google.com/webstore/detail/metamask/nkbihfbeogaeaoehlefnkodbefgpgknn) -
  A cryptocurrency wallet browser extension.
- [Node.js](https://nodejs.org/en/) version >= 16.
- [pnpm](https://pnpm.io/) version >= 7.

```bash
pnpm install // install dependencies
pnpm build  // build the package
pnpm test // run demo
```

the demo will be running on http://localhost:5173/.

<br/>
<p align="center">
<a href=" " target="_blank">
<img src="https://s2.loli.net/2024/01/26/KpoReCAIN9hPrtu.png" width="300" alt="Meteor logo">
</a >
</p >
<br/>

## Usage

```typescript
import { Connector } from "@meteor-web3/connector";

const connector = new Connector();
```

## Functions
### connectWallet
```js
connector.connectWallet({ wallet: WALLET.METAMASK })
```

Connect with user wallet. pass in which wallet you want to connect with,
currently support MetaMask, WalletConnect, Coinbase and Particle Network.
You can also pass in provider from any wallet to perform operations such 
as data reading and writing.

```ts
enum WALLET {
  METAMASK = "MetaMask",
  WALLETCONNECT = "WalletConnect",
  COINBASE = "Coinbase",
  PARTICLE = "Particle"
}
```

- Returns:
  - If the wallet is not connected, a pop-up will appear for the user to select
    a wallet address. After the user selects an address, the address will be
    returned to indicate that the wallet is connected.
  - If the wallet is already connected, will return wallet address and other
    info, example:

```json
{
  "address": "0x312eA852726E3A9f633A0377c0ea882086d66666",
  "chain": {
    "chainId": 80001,
    "chainName": "mumbai"
  },
  "wallet": "MetaMask"
}
```

<br>

### createCapability

```js
connector.runOS({
  method: SYSTEM_CALL.createCapability,
  params: {
    appId,
    resource: RESOURCE.CERAMIC,
  }
})
```

Create a capability for the application to access the data resources.

- `appId`: `string` - which appId is requesting the capability.
- `resource`: `RESOURCE` - Resource to give access to the capability.
  ```js
  enum RESOURCE {
    CERAMIC,
  }
  ```
This method will open a popup and ask the user to sign a message as a capability - grant access for this application to user's data. The message will be in the format below:

```yaml
Message:
Give this application access to some of your data

URI:
did:key:z6MknFM4H7EFyBGANghNvV43uLvUKvRPU94fUcc8AZQZCq8Z

Version:
1

Chain ID:
1

Nonce:
UboH08SYfJn9N2

Issued At:
2023-06-12T06:35:19.225Z

Expires At:
2023-06-19T06:35:19.225Z

Resources: 4
ceramic://*?model=kjzl6hvfrbw6c763ubdhowzao0m4yp84cxzbfnlh4hdi5alqo4yrebmc0qpjdi5
ceramic://*?model=kjzl6hvfrbw6c7cp6xafsa7ghxh1yfw4bsub1363ehrxhi999vlpxny9k69uoxz
ceramic://*?model=kjzl6hvfrbw6c5qdzwi9esxvt1v5mtt7od7hb2947624mn4u0rmq1rh9anjcnxx
ceramic://*?model=kjzl6hvfrbw6c6ad7ydn0hi4vtamx2v620hdgu6llq49h28rfd6cs02g3cmn9za
```

- Returns:
  - `pkh`: `string` - a pkh did you may use to interact with the data resources
    later.

```js
did:pkh:eip155:1:0x29761660d6Cb26a08e9A9c7de12E0038eE9cb623
```

<br>

check all functions in [docs](https://docs.meteor.computer/wallet-apis/connectWallet).

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE.md)
file for details.

## Documentation

View [Docs](https://docs.meteor.computer/).  

View [communicator API Doc](https://meteor-web3.github.io/meteor-sdk/communicator/index.html).  
View [connector API Doc](https://meteor-web3.github.io/meteor-sdk/connector/index.html).  
View [utils API Doc](https://meteor-web3.github.io/meteor-sdk/utils/index.html).  

## Contributing

Contributions to this project are welcome. To contribute, please follow these
steps:

1. Fork the repository and create a new branch.
2. Make your changes and test them thoroughly.
3. Submit a pull request with a detailed description of your changes.
