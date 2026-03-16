# Frontend API Reference

DataChain Africa uses the Hiro Stacks API to read contract state without needing a wallet.

## Base URL

```
https://api.testnet.hiro.so
```

## Read-only Contract Calls

### Endpoint

```
POST /v2/contracts/call-read/{contract_address}/{contract_name}/{function_name}
```

### Request Body

```json
{
  "sender": "ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM",
  "arguments": []
}
```

---

## Useful Calls

### Check if contracts are paused

```bash
# billing
curl -X POST \
  https://api.testnet.hiro.so/v2/contracts/call-read/DEPLOYER/billing/get-paused \
  -H 'Content-Type: application/json' \
  -d '{"sender": "DEPLOYER", "arguments": []}'

# marketplace
curl -X POST \
  https://api.testnet.hiro.so/v2/contracts/call-read/DEPLOYER/marketplace/get-paused \
  -H 'Content-Type: application/json' \
  -d '{"sender": "DEPLOYER", "arguments": []}'
```

### Get platform stats

```bash
curl -X POST \
  https://api.testnet.hiro.so/v2/contracts/call-read/DEPLOYER/marketplace/get-platform-stats \
  -H 'Content-Type: application/json' \
  -d '{"sender": "DEPLOYER", "arguments": []}'
```

### Response format (example)

```json
{
  "okay": true,
  "result": "0x0c000000030d746f74616c2d6c697374696e6773010000000000000000000000000000000d0c746f74616c2d747261646573010000000000000000000000000000000d0c746f74616c2d766f6c756d65010000000000000000000004c4b40000000000"
}
```

The `result` field contains hex-encoded Clarity values. Use `@stacks/transactions` `cvToJSON` to decode.

## Contract Events

All state-changing transactions emit events you can query via:

```
GET /extended/v1/tx/events?tx_id={tx_id}
```

## Rate Limits

The Hiro API is rate-limited to 50 requests/second on testnet. Cache responses where possible.
