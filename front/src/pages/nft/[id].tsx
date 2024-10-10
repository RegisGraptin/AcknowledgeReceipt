import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { Header } from '../../components/Header';
import { useRouter } from 'next/router';
import { useAccount, useReadContract } from 'wagmi';
import { Address } from 'viem';

import AcknowledgeReceipt from "../../abi/AcknowledgeReceipt.json";
import { useEffect, useState } from 'react';

const NFTDetailPage: NextPage = () => {

    const router = useRouter()
    const { id } = router.query

    const { address } = useAccount()

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
                <h2 className="text-xl font-bold mb-4">Private Information</h2>
                <pre className="bg-white p-4 rounded-md shadow-inner overflow-auto max-h-96">
                {/* {JSON.stringify(tokenData, null, 2)} */}
                </pre>
            </div>
            </div>

        </section>
    </div>
  );
};

export default NFTDetailPage;
