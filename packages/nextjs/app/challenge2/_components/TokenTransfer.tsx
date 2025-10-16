"use client";

import { useState } from "react";
import { parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

export const TokenTransfer = () => {
  const { address: connectedAddress } = useAccount();
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");

  const { writeAsync: writeMyTokenAsync } = useScaffoldContractWrite({
    contractName: "MyToken",
    functionName: "transfer",
    args: [recipient as `0x${string}`, parseEther(amount)],
  });

  const { data: tokenBalance } = useScaffoldContractRead({
    contractName: "MyToken",
    functionName: "balanceOf",
    args: [connectedAddress as `0x${string}`],
  });

  const handleTransfer = async () => {
    if (!recipient || !amount) {
      notification.error("Please fill in all fields");
      return;
    }

    try {
      await writeMyTokenAsync({
        args: [recipient as `0x${string}`, parseEther(amount)],
      });

      notification.success("Token transfer successful!");
      setRecipient("");
      setAmount("");
    } catch (error) {
      console.error("Transfer failed:", error);
      notification.error("Transfer failed. Please try again.");
    }
  };

  if (!connectedAddress) {
    return (
      <div className="card w-full bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h2 className="card-title">Transfer Tokens</h2>
          <p>Please connect your wallet to transfer tokens</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card w-full bg-base-100 shadow-xl mb-8">
      <div className="card-body">
        <h2 className="card-title">Transfer Token ($LSEA)</h2>

        <div className="form-control w-full ">
          <label className="label">
            <span className="label-text">Recipient Address</span>
          </label>
          <input
            type="text"
            placeholder="0x..."
            className="input input-bordered w-full "
            value={recipient}
            onChange={e => setRecipient(e.target.value)}
          />
        </div>

        <div className="form-control w-full ">
          <div className="flex justify-between">
            <label className="label">
              <span className="label-text">Amount</span>
            </label>
            <label className="label">
              <span className="label-text">
                Available : {tokenBalance ? (Number(tokenBalance) / 1e18).toFixed(4) : "0.0000"}
              </span>
            </label>
          </div>
          <input
            type="number"
            placeholder="0.0"
            className="input input-bordered w-full "
            value={amount}
            onChange={e => setAmount(e.target.value)}
          />
        </div>

        <div className="card-actions justify-end">
          <button className="btn btn-primary rounded-xl" onClick={handleTransfer} disabled={!recipient || !amount}>
            Transfer
          </button>
        </div>
      </div>
    </div>
  );
};
