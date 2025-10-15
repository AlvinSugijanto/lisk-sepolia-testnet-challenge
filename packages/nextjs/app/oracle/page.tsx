"use client";

import { PriceDisplay } from "./_components/PriceDisplay";
import type { NextPage } from "next";
import { useAccount } from "wagmi";

const Oracle: NextPage = () => {
  const { isConnected } = useAccount();

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Oracle Price Feeds</h2>
            <p>Please connect your wallet to view live prices</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">🔮 Live Price Feeds</h1>
        <p className="text-center text-gray-600">Real-time cryptocurrency prices powered by RedStone Oracle</p>
      </div>

      <div className="flex justify-center items-center gap-6 flex-col sm:flex-row">
        <PriceDisplay symbol="ETH" />
        <PriceDisplay symbol="BTC" />
      </div>
    </div>
  );
};

export default Oracle;
