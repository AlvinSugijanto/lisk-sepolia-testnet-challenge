"use client";

import { useState } from "react";
import { PriceDisplay } from "./_components/PriceDisplay";
import { SmartWalletDemo } from "./_components/SmartWalletDemo";
import type { NextPage } from "next";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { useAccount } from "wagmi";
import { thirdwebClient } from "~~/services/web3/thirdwebConfig";
import { liskSepoliaThirdweb } from "~~/thirdwebChain";

const Oracle: NextPage = () => {
  const { isConnected } = useAccount();
  const account = useActiveAccount();

  const [eventType, setEventType] = useState("feeds");

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
      <div className="flex justify-center mb-6">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${eventType === "feeds" ? "bg-base-100 primary-content" : ""}`}
            onClick={() => setEventType("feeds")}
          >
            Price Feeds
          </button>
          <button
            className={`tab ${eventType === "gasless" ? "bg-base-100 primary-content" : ""}`}
            onClick={() => setEventType("gasless")}
          >
            Gasless
          </button>
        </div>
      </div>
      {eventType === "feeds" && (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-center mb-4">🔮 Live Price Feeds</h1>
            <p className="text-center text-gray-600">Real-time cryptocurrency prices powered by RedStone Oracle</p>
          </div>

          <div className="flex justify-center items-center gap-6 flex-col sm:flex-row">
            <PriceDisplay symbol="ETH" />
            <PriceDisplay symbol="BTC" />
          </div>
        </>
      )}

      {eventType === "gasless" && (
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-center mb-4">⛽ Gasless Transactions</h1>
          <p className="text-center text-gray-600 mb-4">Powered by ERC-4337 Smart Wallets - Pay $0 in gas fees!</p>

          {/* Smart Wallet Connect Button */}
          <div className="flex justify-center mb-8">
            <ConnectButton
              client={thirdwebClient}
              chain={liskSepoliaThirdweb}
              accountAbstraction={{
                chain: liskSepoliaThirdweb,
                sponsorGas: true, // ✅ This enables gasless transactions!
              }}
            />
          </div>
          {account ? (
            <SmartWalletDemo />
          ) : (
            <div className="flex items-center justify-center">
              <div className="card w-96 bg-base-100 shadow-xl">
                <div className="card-body text-center">
                  <h2 className="card-title justify-center">Create a Smart Wallet</h2>
                  <p>Connect above to create your gasless Smart Wallet!</p>
                  <div className="alert alert-info mt-4">
                    <span className="text-xs">
                      ✨ Smart Wallets are deployed on-chain automatically and all transactions are sponsored!
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Oracle;
