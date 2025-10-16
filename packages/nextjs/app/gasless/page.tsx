"use client";

// ✅ Use shared client
import { SmartWalletDemo } from "./_components/SmartWalletDemo";
import type { NextPage } from "next";
import { ConnectButton, useActiveAccount } from "thirdweb/react";
import { thirdwebClient } from "~~/services/web3/thirdwebConfig";
import { liskSepoliaThirdweb } from "~~/thirdwebChain";

const Gasless: NextPage = () => {
  const account = useActiveAccount();

  return (
    <div className="container mx-auto px-4 py-8">
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
  );
};

export default Gasless;
