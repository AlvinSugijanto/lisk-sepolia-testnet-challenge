"use client";

import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { Logo } from "~~/components/Logo";
import { TokenBalance } from "~~/components/TokenBalance";
import { Address } from "~~/components/scaffold-eth";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <section className="mb-8 mx-8">
      <div className="flex items-center justify-center w-full">
        <div className="flex flex-col items-center mt-24">
          <span className="block text-3xl font-bold mb-2 text-center">Welcome to</span>
          <span className="flex items-end gap-4 text-5xl font-bold">
            <Logo size={48} /> Alvin Sugijanto DApps
          </span>
          <div className="flex btn btn-md bg-base-100 justify-center mt-8 mb-8 items-center space-x-2 w-full">
            <p className="my-2 font-medium">Connected Address:</p>
            <Address address={connectedAddress} />
          </div>
          <TokenBalance />
        </div>
      </div>

      {/* <div className="grid grid-cols-2 mt-6 gap-6">
        <TokenTransfer />
        <NFTCollection />
      </div> */}
    </section>
  );
};

export default Home;
