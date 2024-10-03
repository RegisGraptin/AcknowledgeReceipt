import { SecretNetworkClient } from "secretjs";
import { PublicKeyResponse } from "../pages/dashboard/create";


async function retrieveSecretPublicKey(): Promise<Uint8Array> {
    const url = "https://lcd.testnet.secretsaturn.net";

    // To create a readonly secret.js client, just pass in a LCD endpoint
    const secretjs = new SecretNetworkClient({
        chainId: "pulsar-3",
        url,
    });

    let result = await secretjs.query.compute.queryContract({
        contract_address: process.env.NEXT_PUBLIC_SECRET_CONTRACT_ADDRESS!,
        code_hash: process.env.NEXT_PUBLIC_SECRET_CONTRACT_HASH,
        query: { get_contract_key: {} },
    }) as PublicKeyResponse;

    if (!result) {
        throw new Error(`Error when retrieving public key from the smart contract. ${JSON.stringify(result)}`);
    }
    
    return Uint8Array.from(result.public_key);
}


export default retrieveSecretPublicKey;