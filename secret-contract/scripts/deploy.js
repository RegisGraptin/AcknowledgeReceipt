import { SecretNetworkClient, Wallet } from "secretjs";
import * as fs from "fs";
import dotenv from "dotenv";
dotenv.config();

const wallet = new Wallet(process.env.MNEMONIC);

const contract_wasm = fs.readFileSync("../contract.wasm.gz");

const secretjs = new SecretNetworkClient({
    chainId: "pulsar-3",
    url: "https://api.pulsar.scrttestnet.com",
    wallet: wallet,
    walletAddress: wallet.address,
});



// Upload smart contract 
let upload_contract = async () => {
    let tx = await secretjs.tx.compute.storeCode(
        {
            sender: wallet.address,
            wasm_byte_code: contract_wasm,
            source: "",
            builder: "",
        },
        {
            gasLimit: 4_000_000,
        }
    );

    const codeId = Number(
        tx.arrayLog.find((log) => log.type === "message" && log.key === "code_id")
            .value
    );

    console.log("codeId: ", codeId);

    const contractCodeHash = (
        await secretjs.query.compute.codeHashByCodeId({ code_id: codeId })
    ).code_hash;
    console.log(`Contract hash: ${contractCodeHash}`);


    return [codeId, contractCodeHash];
};

let instantiate_contract = async (codeId, contractCodeHash) => {
    // Create an instance of the Counter contract, providing a starting count
    const initMsg = { 
        gateway_address: process.env.SECRET_PATH_GATEWAY_ADDRESS,
        gateway_hash: process.env.SECRET_PATH_GATEWAY_HASH,
        gateway_key: process.env.SECRET_PATH_GATEWAY_KEY,
    };
    let tx = await secretjs.tx.compute.instantiateContract(
        {
            code_id: codeId,
            sender: wallet.address,
            code_hash: contractCodeHash,
            init_msg: initMsg,
            label: "My Counter" + Math.ceil(Math.random() * 10000),
        },
        {
            gasLimit: 400_000,
        }
    );

    //Find the contract_address in the logs
    const contractAddress = tx.arrayLog.find(
        (log) => log.type === "message" && log.key === "contract_address"
    ).value;

    console.log(contractAddress);
};

console.log("Upload...")
let [codeId, contractCodeHash] = await upload_contract();

console.log("Instanciate...")
await instantiate_contract(codeId, contractCodeHash);
