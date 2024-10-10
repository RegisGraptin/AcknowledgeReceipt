import type { NextPage } from 'next';
import { Header } from '../../components/Header';

import { useReadContract, useReadContracts } from 'wagmi'

import AcknowledgeReceipt from "../../abi/AcknowledgeReceipt.json";
import { Address } from 'viem';
import { TokenCard } from '../../components/TokenCard';


const Dashboard: NextPage = () => {

  const { data: lastTokenId, isLoading: lastTokenIdLoading } = useReadContract({
    address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
    abi: AcknowledgeReceipt.abi,
    functionName: 'getLastTokenId',
    args: [],
  })

  const { data: tokensDetail, isLoading: tokensDetailLoading } = useReadContracts({
    contracts: Array.from({ length: Number(lastTokenId) }).map(
      (_, index) => ({
        abi: AcknowledgeReceipt.abi,
        address: process.env.NEXT_PUBLIC_SEI_CONTRACT as Address,
        functionName: "tokenURI",
        args: [index],
      })
    ),
  });

  return (
    <div>
      <Header />


      <section className="bg-white pt-40">
        <div className="gap-16 items-center py-8 px-4 mx-auto max-w-screen-xl lg:grid lg:grid-cols-3 lg:py-16 lg:px-6">
        

          {lastTokenIdLoading && (
            <div>Loading id..</div>
          )}

          {tokensDetailLoading && (
            <div>Loading details..</div>
          )}

          
            {tokensDetail && tokensDetail.map(function (tokenDetail, i) {
              return <TokenCard key={i} tokenId={i} tokenDetail={tokenDetail.result} />
            })}
          


        
          </div>
        </section>
    </div>
  );
};

export default Dashboard;
