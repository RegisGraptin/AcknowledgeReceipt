import { ConnectButton } from '@rainbow-me/rainbowkit';
import type { NextPage } from 'next';
import { Header } from '../components/Header';

const Home: NextPage = () => {
  return (
    <div>

      <Header />

      <div className="relative isolate px-6 pt-14 lg:px-8">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]" style={{ "clipPath": "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>
        <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">
          <div className="text-center">
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
              Private Acknowledge Receipt on Chain (PARC)
            </h1>
            <p className="mt-6 text-lg leading-8 text-gray-600">
              Secure, Acknowledge, and Trust — Private Content with Public Accountability.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <a href="/dashboard" className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Get started</a>
              <a href="#learn_more" className="text-sm font-semibold leading-6 text-gray-900">Learn more <span aria-hidden="true">→</span></a>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]" aria-hidden="true">
          <div className="relative left-[calc(50%+3rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 bg-gradient-to-tr from-[#ff80b5] to-[#9089fc] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]" style={{ "clipPath": "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)" }}></div>
        </div>
      </div>


      <div>



        <section className="bg-white" id="learn_more">
          <div className="gap-16 items-center py-8 px-4 mx-auto max-w-screen-xl lg:grid lg:grid-cols-2 lg:py-16 lg:px-6">

            <div className="grid mt-6">
              <img className='rounded-lg' src="/images/image_1.jpg" alt="mockup" />
            </div>

            <div className="font-light text-gray-500 sm:text-lg">
              <h2 className="mb-4 text-4xl tracking-tight font-extrabold text-gray-900">
                Private Acknowledge Receipt
              </h2>
              <p className="mb-4">

                Introducing PARC, an innovative blockchain-based solution that allows users to create NFTs with public and private content. Users can share confidential information through NFTs and know exactly when the recipient has accessed it. All interactions are secured on-chain, ensuring both transparency and privacy.

              </p>
            </div>

          </div>
        </section>


        <section className='pt-30 pb-40'>
          <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
            <div className="mx-auto max-w-screen-sm text-center">
              <h2 className="mb-4 text-4xl tracking-tight font-extrabold leading-tight">
                How It Works
              </h2>
            </div>
          </div>

          <div className="mx-auto max-w-2xl lg:max-w-4xl">

            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-10 lg:max-w-none lg:grid-cols-2 lg:gap-y-16">
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    1.
                  </div>
                  Create an NFT with Public and Private Content
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Using PARC, you can mint an NFT that contains both public and private data. The public portion is visible to everyone, but the private content is locked and only accessible to the designated recipient.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    2.
                  </div>
                  Transfer the NFT
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  You transfer the NFT to the intended recipient. They can view the public content, but the private information remains encrypted and hidden until the recipient decides to access it.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    3.
                  </div>
                  Sign a Transaction to Unlock Private Content
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  To view the private data, the recipient must sign a transaction on-chain. This not only gives them access to the hidden content but also triggers an acknowledgement receipt to the NFT owner, notifying them that the content has been accessed.
                </dd>
              </div>
              <div className="relative pl-16">
                <dt className="text-base font-semibold leading-7 text-gray-900">
                  <div className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-600 text-white">
                    4.
                  </div>
                  On-Chain Notification
                </dt>
                <dd className="mt-2 text-base leading-7 text-gray-600">
                  Once the private content is viewed, an immutable record is created on the blockchain, confirming that the recipient has seen the information.
                </dd>
              </div>
            </dl>
          </div>
        </section>


      </div>


      <hr />

      <section className="bg-white pt-30">

        <div className="py-8 px-4 mx-auto max-w-screen-xl sm:py-16 lg:px-6">
          <div className="mx-auto max-w-screen-sm text-center">
            <h2 className="mb-4 text-4xl tracking-tight font-extrabold leading-tight">Try Private Acknowledge Receipt on Chain Today</h2>
            <p className="mb-6 font-light text-gray-500 dark:text-gray-400 md:text-lg">
            Mint your first NFT with PARC today and discover a new level of privacy, accountability, and trust on the blockchain.
            Get started and see how easy it is to protect your confidential content!

            </p>
            <a href="/dashboard" className="inline-flex items-center justify-center px-5 py-3 text-base font-medium text-center text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:ring-gray-100">
              Get started
            </a>
          </div>
        </div>
      </section>



      <footer className="bg-white sm:p-6">
        <div className="mx-auto max-w-screen-xl">
          <div className="md:flex md:justify-between">
            <div className="mb-6 md:mb-0">
              <a href="/" className="flex items-center">
                <img src="/images/logo.png" className="mr-3 h-6 sm:h-16" alt="PARC Logo" />
                <span className="self-center text-2xl font-semibold whitespace-nowrap">PARC</span>
              </a>
            </div>
            <div className="grid grid-cols-2 gap-8 sm:gap-6 sm:grid-cols-3">

            </div>
          </div>
          <hr className="my-6 border-gray-200 sm:mx-auto dark:border-gray-700 lg:my-8" />
          <div className="sm:flex sm:items-center sm:justify-between">
            <span className="text-sm text-gray-500 sm:text-center">© 2024 <a href="#" className="hover:underline">PARC</a>. All Rights Reserved.
            </span>
            <div className="flex mt-4 space-x-6 sm:justify-center sm:mt-0">
            </div>
          </div>
        </div>
      </footer>


    </div>
  );
};

export default Home;
