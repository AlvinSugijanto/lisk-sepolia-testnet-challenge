"use client";

import { useAccount } from "wagmi";
import { useScaffoldContractRead } from "~~/hooks/scaffold-eth";

export const TokenBalance = () => {
  const { address: connectedAddress } = useAccount();

  const { data: tokenBalance } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
  });

  const { data: tokenSymbol } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "symbol",
  });

  const { data: tokenName } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "name",
  });

  if (!connectedAddress) {
    return <div className=""></div>;
  }

  return (
    <div className="card bg-base-100 shadow-xl">
      <div className="px-24 py-5">
        <div className="flex items-center gap-6">
          <div className="rounded-full px-3.5 pb-2 bg-white text-gray-600 text-4xl border font-semibold border-gray-300">
            L
          </div>
          <div>
            <h2 className="font-bold text-lg leading-none">{tokenName}</h2>
            <p className=" text-gray-300">
              {tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000"} {tokenSymbol}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
