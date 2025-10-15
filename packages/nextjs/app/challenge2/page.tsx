"use client";

import { NFTCollection } from "./_components/NFTCollection";
import { TokenTransfer } from "./_components/TokenTransfer";
import type { NextPage } from "next";

const Home: NextPage = () => {
  return (
    <section className="m-8">
      <p className="text-3xl text-white font-semibold">Challenge 2</p>
      <div className="grid grid-cols-2 mt-6 gap-6">
        <TokenTransfer />
        <NFTCollection />
      </div>
    </section>
  );
};

export default Home;
