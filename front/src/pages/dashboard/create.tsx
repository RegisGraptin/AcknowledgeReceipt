import type { NextPage } from 'next';
import { Header } from '../../components/Header';

import { BaseError, useAccount, useReadContract, useWaitForTransactionReceipt } from 'wagmi'

import { ecdh, chacha20_poly1305_seal } from "@solar-republic/neutrino";

import AcknowledgeReceipt from "../../abi/AcknowledgeReceipt.json";
import Gateway from "../../abi/Gateway.json";

import { hexlify, SigningKey, computeAddress, recoverAddress, keccak256, toBeHex } from "ethers";

import {
  bytes,
  bytes_to_base64,
  json_to_bytes,
  sha256,
  concat,
  text_to_bytes,
  base64_to_bytes,
} from "@blake.regalia/belt";

import { FormEvent, useEffect, useState } from 'react';

import { useWriteContract } from 'wagmi'
import { Address } from 'viem';

import { PinataSDK } from "pinata";

import { SecretNetworkClient } from "secretjs";
import ECDHEncryption from '../../utils/ECDHEncryption';
import retrieveSecretPublicKey from '../../utils/SecretHelper';
import encryptPayload from '../../utils/Encryption';
import { ethers } from 'ethers';

export interface PublicKeyResponse {
  public_key: Array<number>;
}

const CreateAcknowledgeReceipt: NextPage = () => {

  const { address } = useAccount();
  const [publicKey, setPublicKey] = useState<Uint8Array>();
  

  useEffect(() => {
    if (!publicKey) {
      retrieveSecretPublicKey().then((value) => {
        setPublicKey(value);
      });
    }
  }, []);

  // Initialize Pinata storage
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  });

  const {
    data: hash,
    error,
    isPending,
    writeContract
  } = useWriteContract()

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash,
  })

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const formData = new FormData(event.currentTarget)
    console.log(formData)

    let data = await encryptPayload(publicKey!, formData.get("privateDescription"));
    console.log(data);


    



    const iface = new ethers.Interface(Gateway.abi);

    const routing_contract = "secret1eh49wvgz6jkum4gfz2kep8nk3lzh2qr79xyfhl";
    const routing_code_hash = "05ea2138f2d32726f4a6fa88ed7281e3d9c31fd2bf36e2a39c58f4ba2c210277";


    const provider = new ethers.BrowserProvider(window.ethereum)
    // const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    const myAddress = address;

    const wallet = ethers.Wallet.createRandom();
    const userPrivateKeyBytes = ethers.getBytes(wallet.privateKey);
    const userPublicKey = new SigningKey(wallet.privateKey).compressedPublicKey;
    const userPublicKeyBytes = ethers.getBytes(userPublicKey);
    const gatewayPublicKey = "A20KrD7xDmkFXpNMqJn1CLpRaDLcdKpO1NdBBS7VpWh3";
    const gatewayPublicKeyBytes = base64_to_bytes(gatewayPublicKey);

    const sharedKey = await sha256(
      ecdh(userPrivateKeyBytes, gatewayPublicKeyBytes)
    );

    const callbackSelector = iface.getFunction("upgradeHandler")?.selector;
    const callbackGasLimit = 300000;


    // Secret path address - Gateway SEI Devnet
    let publicClientAddress = "0x8EaAB5e8551781F3E8eb745E7fcc7DAeEFd27b1f";

    const callbackAddress = publicClientAddress.toLowerCase();
    console.log("callback address: ", callbackAddress);
    console.log("my data: ", data);

    // Warning on the id as it cannot be modify as it will be seal
    // Be sure to keep consistency in the secret smart contract!

    // Payload construction
    const payload = {
      data: data,
      routing_info: routing_contract,
      routing_code_hash: routing_code_hash,
      user_address: myAddress,
      user_key: bytes_to_base64(userPublicKeyBytes),
      callback_address: bytes_to_base64(ethers.getBytes(callbackAddress)),
      callback_selector: bytes_to_base64(ethers.getBytes(callbackSelector!)),
      callback_gas_limit: callbackGasLimit,
    };

    const plaintext = json_to_bytes(payload);
    const nonce = crypto.getRandomValues(bytes(12));

    const [ciphertextClient, tagClient] = chacha20_poly1305_seal(
      sharedKey,
      nonce,
      plaintext
    );
    const ciphertext = concat([ciphertextClient, tagClient]);
    const ciphertextHash = keccak256(ciphertext);
    const payloadHash = keccak256(
      concat([
        text_to_bytes("\x19Ethereum Signed Message:\n32"),
        ethers.getBytes(ciphertextHash),
      ])
    );
    const msgParams = ciphertextHash;

    const params = [myAddress, msgParams];
    const method = "personal_sign";
    const payloadSignature = await provider.send(method, params);
    const user_pubkey = SigningKey.recoverPublicKey(payloadHash, payloadSignature);

    const _info = {
      user_key: hexlify(userPublicKeyBytes),
      user_pubkey: user_pubkey,
      routing_code_hash: routing_code_hash,
      task_destination_network: "pulsar-3",
      handle: "store",
      nonce: hexlify(nonce),
      payload: hexlify(ciphertext),
      payload_signature: payloadSignature,
      callback_gas_limit: callbackGasLimit,
    };

    const gasFee = Number((await provider.getFeeData()).gasPrice)
    let amountOfGas = gasFee * callbackGasLimit * 3 / 2;

    // Write to smart contract
    // writeContract({
    //   address: "0x8EaAB5e8551781F3E8eb745E7fcc7DAeEFd27b1f" as Address,
    //   abi: Gateway.abi,
    //   functionName: 'send',
    //   args: [
    //     payloadHash,
    //     myAddress,
    //     routing_contract,
    //     _info,
    //   ],
    //   value: BigInt(amountOfGas),
    // })



    // // Store on IPFS the public data
    const upload = await pinata.upload.json({
      title: formData.get("title"),
      description: formData.get("description"),
    });

    // Write to smart contract
    writeContract({
      address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
      abi: AcknowledgeReceipt.abi,
      functionName: 'createReceipt',
      args: [
        formData.get("recipient")?.toString(),
        upload["cid"],
        payloadHash,
        routing_contract,
        _info,
      ],
      value: BigInt(amountOfGas),
    })

  }

  return (
    <>
      <Header />
      <form onSubmit={onSubmit}>
        <div className="min-h-screen p-6 bg-gray-100 flex items-center justify-center">
          <div className="container max-w-screen-lg mx-auto">
            <div>
              <h2 className="font-semibold text-xl text-gray-600">Create an Acknowledge Receipt</h2>
              <p className="text-gray-500 mb-6">Create a new acknowledge receipt.</p>

              <div className="bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6">
                <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
                  <div className="text-gray-600">
                    <p className="font-medium text-lg">Public Information</p>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">
                      <div className="md:col-span-5">
                        <label htmlFor="title">Title</label>
                        <input type="text" name="title" id="title" className="h-10 border mt-1 rounded px-4 w-full bg-gray-50" />
                      </div>

                      <div className="md:col-span-5">
                        <label htmlFor="description">Description</label>
                        <textarea
                          id="description"
                          name='description'
                          rows={4}
                          className="block p-2.5 w-full text-sm bg-gray-50 rounded-lg border border-gray-50"
                          placeholder="Description of the receipt...">
                        </textarea>
                      </div>

                      <div className="md:col-span-5">
                        <label htmlFor="recipient">Recipient</label>
                        <input 
                          type="text" 
                          name="recipient" 
                          id="recipient" 
                          className="h-10 border mt-1 rounded px-4 w-full bg-gray-50" 
                          placeholder='0x...'
                        />
                      </div>

                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded shadow-lg p-4 px-4 md:p-8 mb-6">
                <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 lg:grid-cols-3">
                  <div className="text-gray-600">
                    <p className="font-medium text-lg">Private Information</p>
                  </div>

                  <div className="lg:col-span-2">
                    <div className="grid gap-4 gap-y-2 text-sm grid-cols-1 md:grid-cols-5">

                      <div className="md:col-span-5">
                        <label htmlFor="privateDescription">Private information</label>
                        <textarea
                          id="privateDescription"
                          name='privateDescription'
                          rows={4}
                          className="block p-2.5 w-full text-sm bg-gray-50 rounded-lg border border-gray-50"
                          placeholder="Private information of the receipt...">
                        </textarea>
                      </div>

                      <div className="md:col-span-5 text-right">
                        <div className="inline-flex items-end">
                          <button disabled={isPending} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                            {isPending ? 'Confirming...' : 'Submit'}
                          </button>
                        </div>
                      </div>


                      {hash && <div>Transaction Hash: {hash}</div>}
                      {isConfirming && <div>Waiting for confirmation...</div>}
                      {isConfirmed && <div>Transaction confirmed.</div>}
                      {error && (
                        <div>Error: {(error as BaseError).shortMessage || error.message}</div>
                      )}

                    </div>
                  </div>
                </div>
              </div>


            </div>
          </div>
        </div>
      </form>
    </>
  );
};

export default CreateAcknowledgeReceipt;
