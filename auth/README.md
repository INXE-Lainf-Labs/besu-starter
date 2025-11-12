The platform provides endpoints for compiling and deploying Solidity smart contracts.

This method keeps your private key secure by signing transactions locally before sending to the API.

**Step 1: Compile Contract**
- Endpoint: `POST https://localhost/api/v1/besu/compile-contract/`
- Headers: `Authorization: Bearer <token>`
- Body: form-data with `contract_file` (select .sol file)
- Response includes: ABI, bytecode, and contract name


**Step 2: Sign Transaction Locally**
- Open [sign_transaction.py](src/misc/sign_transaction.py)
- Add the ABI and bytecode from compilation
- Configure constructor parameters
- Run: `python sign_transaction.py`
- Copy the generated signed transaction hex

**Step 3: Deploy Signed Transaction**
- Endpoint: `POST https://localhost/api/v1/besu/deploy-signed/`
- Headers: `Authorization: Bearer <token>`, `Content-Type: application/json`
- Body: raw JSON
  ```json
  {
    "signed_transaction": "0x..."
  }
  ```
- Response includes: contract address, transaction hash, gas used

The following diagram illustrates the contract deployment flow using signed transactions:

```mermaid

sequenceDiagram
	autonumber
	participant AU as Admin User
	participant AS as Auth Server
	
	
	AU->>AS: /smart-contract/compile/
	Note over AU: Send contract code<br> for compilation
	AS-->>AU:  
	Note over AS: Send raw trasaction<br> as response
	AU->>AS: /smart-contract/deploy/
	Note over AU: Send signed transaction<br> to deploy the contract
	
	create participant B as Besu
	AS->>B: :sendRawTransaction
	Note over AS: Deploy contract

```