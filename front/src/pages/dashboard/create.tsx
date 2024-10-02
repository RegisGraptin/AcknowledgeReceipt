import type { NextPage } from 'next';
import { Header } from '../../components/Header';

import { BaseError, useReadContract, useWaitForTransactionReceipt } from 'wagmi'

import abi from "../../abi/AcknowledgeReceipt.json";
import { FormEvent, useEffect, useState } from 'react';

import { useWriteContract } from 'wagmi'
import { Address } from 'viem';

import { PinataSDK } from "pinata";

import { SecretNetworkClient } from "secretjs";

export interface PublicKeyResponse {
  public_key: Array<number>;
}

const CreateAcknowledgeReceipt: NextPage = () => {

  const [publicKey, setPublicKey] = useState<Uint8Array>();

  useEffect(() => {

    async function retrieveSecretPublicKey() {
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
      setPublicKey(Uint8Array.from(result.public_key));
    }

    if (!publicKey) {
      retrieveSecretPublicKey();
    }
  }, []);

  

  // Initialize Pinata storage
  const pinata = new PinataSDK({
    pinataJwt: process.env.NEXT_PUBLIC_PINATA_JWT!,
    pinataGateway: process.env.NEXT_PUBLIC_PINATA_GATEWAY,
  });

  // FIXME :: 
  let address = "0x000"

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

    // formData.get("recipient")
    // formData.get("privateDescription")

    // Store on IPFS the public data
    const upload = await pinata.upload.json({
      title: formData.get("title"),
      description: formData.get("description"),
    });

    console.log("upload result");
    console.log(upload);


    // Write to smart contract
    writeContract({
      address: address as Address,
      abi,
      functionName: 'createGrantProposal',
      args: [
        formData.get("title"),
        formData.get("description"),
        formData.get("nb_projects"),
      ]
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