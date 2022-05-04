# OpenLuck Subgraph

- Mainnet-BSC: https://thegraph.com/explorer/subgraph?id=
- Testnet-BSC: https://graph.openluck.org/api/v1testnet/graphql

### Install

```bash
yarn install
```

### Prepare

```bash
yarn prepare:${network} (mainnet, rinkeby)
```

- Runs a script to generate handlers for projects' ERC20 tokens, defined in the `erc20s` property of `config/**.json`.
- Compiles subgraph.yaml from subgraph.template.yaml
- Generates types from schema.graphql

### Deploy

First you will need to authenticate with the proper deploy key for the given network. Or you can create your own Subgraph and deploy key for testing:

```bash
graph auth  --studio ${your-key}
```

If you are deploying one of the official OpenLuck subgraphs:

```bash
yarn deploy:${network}
```

If you are deploying your own Subgraph for testing:

```bash
graph deploy --node https://api.studio.thegraph.com/deploy/${project}
```

To check health of a deployed subgraph: 

```
curl -X POST -d '{ "query": "{indexingStatuses(subgraphs: [\"<deployment-id>\"]) {synced health fatalError {message block { number } handler } subgraph chains { chainHeadBlock { number } latestBlock { number }}}}"}' https://api.thegraph.com/index-node/graphql
```
