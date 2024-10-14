import { MetaMaskWallet, Permission, stringToCoins } from "secretjs";
import { StdSignDoc } from "secretjs/dist/wallet_amino";


export async function generatePermit(
    secretWallet: MetaMaskWallet,
    secretContractAddress: string = process.env.NEXT_PUBLIC_SECRET_CONTRACT_ADDRESS!,
    chainId: string = "pulsar-3",
) {
    const permitName = "SECRET_ACCESS_PRIVATE_DATA" + Math.ceil(Math.random() * 1000000);
    const permissions: Permission[] = ["owner"];

    const createSignDoc = (): StdSignDoc => (
        {
            chain_id: chainId,
            account_number: "0", // Must be 0
            sequence: "0", // Must be 0
            fee: {
            amount: stringToCoins("0uscrt"), // Must be 0 uscrt
            gas: "1", // Must be 1
            },
            msgs: [
            {
                type: "query_permit", // Must be "query_permit"
                value: {
                permit_name: permitName,
                allowed_tokens: [process.env.NEXT_PUBLIC_SECRET_CONTRACT_ADDRESS!],
                permissions
                },
            },
            ],
            memo: "", // Must be empty
        }
    );

    const signDoc = createSignDoc();
    // Note: we signed with amino instead of permit as it is "not safe transaction" from metamask
    // and allow us to use `personal_sign` instead.
    // Notice that though that, we will have to handle this signature schema inside the
    // smart contract.
    // Note that it prefix the content by "\x19Ethereum Signed Message:\n" + len(msg) + msg
    // Note also that the msg is json prettyfied !
    const signature = (await secretWallet.signAmino(secretWallet.address, signDoc)).signature;
    
    let permitPayload = {
        params: {
            chain_id: chainId,
            permit_name: permitName,
            allowed_tokens: [secretContractAddress],
            permissions: permissions,
        },
        signature: signature,
    };

    return permitPayload;
}
