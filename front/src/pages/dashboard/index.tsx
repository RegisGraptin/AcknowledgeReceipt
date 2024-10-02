import type { NextPage } from 'next';
import { Header } from '../../components/Header';

import { useReadContract, useReadContracts } from 'wagmi'

import abi from "../../abi/AcknowledgeReceipt.json";
import { Address } from 'viem';
import { TokenCard } from '../../components/TokenCard';


const Dashboard: NextPage = () => {

  // FIXME :: 
  let address = "0x000"

  const { data: lastTokenId, isLoading: lastTokenIdLoading } = useReadContract({
    address: address as Address,
    abi,
    functionName: 'getLastTokenId',
    args: [],
  })

  const { data: tokensDetail, isLoading: tokensDetailLoading } = useReadContracts({
    contracts: Array.from({ length: Number(lastTokenIdLoading) }).map(
      (_, index) => ({
        abi,
        address: address as Address,
        functionName: "tokenURI",
        args: [index],
      })
    ),
  });

  return (
    <div>
      <Header />

      <section className='container mx-auto px-4'>

        {lastTokenIdLoading && (
          <div>Loading id..</div>
        )}

        {tokensDetailLoading && (
          <div>Loading details..</div>
        )}

        <div>
          {tokensDetail && tokensDetail.map(function (tokenDetail, i) {
            return <TokenCard key={i} tokenDetail={tokenDetail.result} />
          })}

        </div>


      </section>
    </div>
  );
};

export default Dashboard;
