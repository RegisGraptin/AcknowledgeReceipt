import { PinataSDK } from "pinata";
import { useEffect, useState } from "react";

export const TokenCard = ({tokenId, tokenDetail}) => {

    function displayCid(cid: string, startChars: number = 15, endChars: number = 3): string {
        // If the CID length is less than or equal to start + end, no need to shorten it
        if (cid.length <= startChars + endChars) {
            return cid;
        }
    
        // Extract the start and end parts of the CID
        const start = cid.substring(0, startChars);
        const end = cid.substring(cid.length - endChars);
    
        // Return the formatted shortened CID
        return `${start}...${end}`;
    }


    return (
        <>
                    <div>

                    <a href={"/nft/" + Number(tokenId)} className="opacity-80 hover:opacity-100" data-modal-target="default-modal" data-modal-toggle="default-modal">

                        <div className="relative grid h-[35rem] max-w-lg flex-col items-end justify-center overflow-hidden rounded-lg bg-white">
                            <div className="absolute inset-0 m-0 h-full w-full overflow-hidden rounded-none bg-transparent bg-[url('/images/nft.jpg')] bg-cover bg-center">
                                <div className="to-bg-black-10 absolute inset-0 h-full w-full bg-gradient-to-t from-black/80 via-black/50"></div>
                            </div>
                            <div className="relative text-center p-6 px-6 py-14 md:px-12">
                                <h2 className="mb-6 text-3xl font-medium text-white">
                                    {displayCid(tokenDetail)}
                                </h2>
                                <h5 className="mb-4 text-xl font-semibold text-slate-300">
                                    NFT #{Number(tokenId) + 1}
                                </h5>
                            </div>
                        </div>
                    </a>

                    </div>


        </>
    )
}