import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { Header } from '../../components/Header';
import { useRouter } from 'next/router';
import { useAccount, useReadContract, useWalletClient } from 'wagmi';
import { Address } from 'viem';

import AcknowledgeReceipt from "../../abi/AcknowledgeReceipt.json";
import { useEffect, useState } from 'react';
import { MetaMaskWallet, Permission, SecretNetworkClient, stringToCoins } from 'secretjs';
import { StdSignDoc } from 'secretjs/dist/wallet_amino';
import { generatePermit } from '../../utils/MetamaskPermit';

const NFTDetailPage: NextPage = () => {

    const router = useRouter()
    const { id } = router.query

    const { address } = useAccount()
    const [secretWallet, setSecretWallet] = useState();
    const [secretAddress, setSecretAddress] = useState();
    
    
    const { data: tokenDetail, isLoading: tokenDetailLoading } = useReadContract({
        address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
        abi: AcknowledgeReceipt.abi,
        functionName: 'tokenURI',
        args: [id],
    })

    const { data: tokenOwner, isLoading: tokenOwnerLoading } = useReadContract({
        address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
        abi: AcknowledgeReceipt.abi,
        functionName: 'ownerOf',
        args: [id],
    })

    const { data: senderAndRecipient, isLoading: senderAndRecipientLoading } = useReadContract({
        address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
        abi: AcknowledgeReceipt.abi,
        functionName: 'getSenderAndRecipient',
        args: [id],
    })

    const [tokenData, setTokenData] = useState(null);



    // let query = async () => {
    // const secretjs = new SecretNetworkClient({
    //     url: "https://lcd.testnet.secretsaturn.net",
    //     chainId: "pulsar-3",
    // })

        
      
    //     const query_tx = await secretjs.query.compute.queryContract({
    //       contract_address: process.env.NEXT_PUBLIC_SECRET_CONTRACT_ADDRESS!,
    //       code_hash: process.env.NEXT_PUBLIC_SECRET_CONTRACT_HASH,
    //       query: { with_permit: {} },
    //     })
    //     console.log(query_tx)
    //   }
    

    useEffect(() => {
        if (!address) { return; }
        const init = async () => {
          const wallet = await MetaMaskWallet.create(
            window.ethereum,
            address || ""
          );

          setSecretWallet(wallet);
          setSecretAddress(wallet.address);
        };
        init();
      }, [address]);

      console.log(secretAddress)
    


    useEffect(() => {
        const fetchData = async () => {  

            // Wait to have a CID
            if (!tokenDetail) { return; }

            const response = await fetch('/api/pinata', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(tokenDetail),
            });
            const result = await response.json();

            if (result.success) {
                console.log(result.data);
                setTokenData(result.data);
            } else {
                console.error('Error pinning data:', result.error);
            }
        };
        fetchData();
    }, [tokenDetail]);

    
    const fetchDataFromSecret = async () => {
        if (!secretWallet) {
            console.log("Wait secret wallet connection");
            return;
        }
    
        const secretjs = new SecretNetworkClient({
            chainId: "pulsar-3",
            url: "https://api.pulsar3.scrttestnet.com",
            wallet: secretWallet,
            walletAddress: secretWallet.address,
        });

        // console.log("sing addres::", secretWallet.address)



        let permitPayload = await generatePermit(secretWallet)


            
            



        
        console.log("permit:", permitPayload);

        // return {
        //     with_permit: {
        //       permit: payload,
        //       ...(payload as any),
        //     },
        //   };
    }


  return (
    <div>

        <Header />
        
        <section className='container mx-auto pt-40'>
            <h2 className="text-4xl font-extrabold">
                NFT detail
            </h2>
            {!tokenOwnerLoading && (
                <p className="my-4 text-lg text-gray-500">
                    Token owner {tokenOwner}
                </p>
            )}

            {!senderAndRecipientLoading && (
                <p className="my-4 text-lg text-gray-500">
                    Sender {senderAndRecipient[0]} --- Receiver {senderAndRecipient[1]}
                </p>
            )}


            <div className="flex flex-col md:flex-row justify-between p-6 space-y-6 md:space-y-0 md:space-x-6">
            {/* Public Information */}
            <div className="w-full md:w-1/2 p-4 bg-gray-100 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">Public Information</h2>
                <pre className="bg-white p-4 rounded-md shadow-inner overflow-auto max-h-96">
                {tokenDetailLoading && (
                    "Loading public detail..."
                )}
                {!tokenDetailLoading && JSON.stringify(tokenData, null, 2)}
                </pre>
            </div>

            {/* Private Information */}
            <div className="w-full md:w-1/2 p-4 bg-gray-100 rounded-lg shadow-md">
                <h2 className="text-xl font-bold mb-4">
                    Private Information
                </h2>
                {secretAddress && (
                    <p className="my-4 text-lg text-gray-500">
                        Secret address: `{secretAddress}`
                    </p>
                )}

                {senderAndRecipient && address == senderAndRecipient[1] && (
                    <>
                        <button 
                            type="button" 
                            className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 focus:outline-none dark:focus:ring-blue-800"
                            onClick={fetchDataFromSecret}
                        >
                            Get Access
                        </button>

                        {/* <pre className="bg-white p-4 rounded-md shadow-inner overflow-auto max-h-96">
                            {JSON.stringify(tokenData, null, 2)}
                        </pre> */}
                    </>
                )}
                {senderAndRecipient && address != senderAndRecipient[1] && (
                    <pre className="bg-white p-4 rounded-md shadow-inner overflow-auto max-h-96">
                        No data access...
                    </pre>
                )}
            </div>
            </div>

        </section>
    </div>
  );
};

export default NFTDetailPage;
