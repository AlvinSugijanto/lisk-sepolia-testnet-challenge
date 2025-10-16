"use client";

import { useEffect, useState } from "react";
import { WrapperBuilder } from "@redstone-finance/evm-connector";
import { getSignersForDataServiceId } from "@redstone-finance/sdk";
import { ethers } from "ethers";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useDeployedContractInfo, useScaffoldContractRead, useScaffoldContractWrite } from "~~/hooks/scaffold-eth";
import { notification } from "~~/utils/scaffold-eth";

interface NFTCardProps {
  tokenId: number;
}

export const NFTCard = ({ tokenId }: NFTCardProps) => {
  const { address: connectedAddress } = useAccount();
  const [showListModal, setShowListModal] = useState(false);
  const [listPrice, setListPrice] = useState("");
  const [isApproved, setIsApproved] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [ethPriceUSD, setEthPriceUSD] = useState<number>(0);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);

  // Get PriceFeed contract info
  const { data: priceFeedContract } = useDeployedContractInfo("PriceFeed");

  // Get NFT owner
  const { data: owner } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "ownerOf",
    args: [BigInt(tokenId)],
  });

  // Get listing info
  const { data: listing, refetch: refetchListing } = useScaffoldContractRead({
    contractName: "NFTMarketplace",
    functionName: "getListing",
    args: [BigInt(tokenId)],
  });

  // Get marketplace contract info (we need its address for approval)
  const { data: marketplaceContract } = useDeployedContractInfo("NFTMarketplace");
  const marketplaceAddress = marketplaceContract?.address;

  // Check if marketplace is approved
  const { data: approvedAddress, refetch: refetchApproved } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "getApproved",
    args: [BigInt(tokenId)],
  });

  const { data: isApprovedForAll, refetch: refetchApprovedForAll } = useScaffoldContractRead({
    contractName: "MyNFT",
    functionName: "isApprovedForAll",
    args: [owner as `0x${string}`, marketplaceAddress as `0x${string}`],
  });

  // Fetch ETH price from oracle
  const fetchEthPrice = async () => {
    if (!priceFeedContract || typeof window === "undefined" || !window.ethereum) {
      return;
    }

    try {
      setIsLoadingPrice(true);

      // Create ethers provider and contract
      const provider = new ethers.providers.Web3Provider(window.ethereum as any);
      const contract = new ethers.Contract(priceFeedContract.address, priceFeedContract.abi, provider);

      // Wrap contract with RedStone data
      const wrappedContract = WrapperBuilder.wrap(contract).usingDataService({
        dataPackagesIds: ["ETH"],
        authorizedSigners: getSignersForDataServiceId("redstone-main-demo"),
      });

      // Get ETH price
      const priceData = await wrappedContract.getEthPrice();
      const formattedPrice = Number(priceData) / 1e8; // Convert from 8 decimals
      setEthPriceUSD(formattedPrice);
    } catch (error) {
      console.error("Error fetching ETH price:", error);
    } finally {
      setIsLoadingPrice(false);
    }
  };

  // Fetch price on mount and every 30 seconds
  useEffect(() => {
    fetchEthPrice();
    const interval = setInterval(fetchEthPrice, 30000);
    return () => clearInterval(interval);
  }, [priceFeedContract]);

  // Update approval status
  useEffect(() => {
    if (marketplaceAddress) {
      setIsApproved(
        approvedAddress?.toLowerCase() === (marketplaceAddress as string).toLowerCase() || isApprovedForAll === true,
      );
    }
  }, [approvedAddress, isApprovedForAll, marketplaceAddress]);

  // Contract writes
  const { writeAsync: approveMarketplace } = useScaffoldContractWrite({
    contractName: "MyNFT",
    functionName: "setApprovalForAll",
    args: [marketplaceAddress as `0x${string}`, true],
    onBlockConfirmation: async (txnReceipt: any) => {
      console.log("Approval confirmed in block:", txnReceipt.blockNumber);
      // Refetch approval status after transaction is confirmed
      await refetchApproved();
      await refetchApprovedForAll();
      // Set approving state to false after refetch completes
      setIsApproving(false);
      notification.success("Marketplace approved! You can now list your NFT.");
    },
  });

  const { writeAsync: listItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "listItem",
    args: [BigInt(tokenId), parseEther(listPrice || "0")],
  });

  const { writeAsync: buyItem } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "buyItem",
    args: [BigInt(tokenId)],
    value: listing && listing.isActive ? listing.price : undefined,
  });

  const { writeAsync: cancelListing } = useScaffoldContractWrite({
    contractName: "NFTMarketplace",
    functionName: "cancelListing",
    args: [BigInt(tokenId)],
  });

  // Handle approval
  const handleApprove = async () => {
    try {
      setIsApproving(true);
      await approveMarketplace();
      notification.success("Approval transaction sent! Waiting for confirmation...");
      // Note: onBlockConfirmation callback will handle success notification and reset isApproving
    } catch (error) {
      console.error("Approval failed:", error);
      notification.error("Approval failed");
      setIsApproving(false);
    }
  };

  // Handle listing
  const handleList = async () => {
    if (!listPrice || parseFloat(listPrice) <= 0) {
      notification.error("Please enter a valid price");
      return;
    }

    try {
      await listItem();
      notification.success("NFT listed successfully!");
      setShowListModal(false);
      setListPrice("");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Listing failed:", error);
      notification.error("Listing failed");
    }
  };

  // Handle buy
  const handleBuy = async () => {
    try {
      await buyItem();
      notification.success("NFT purchased successfully!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Purchase failed:", error);
      notification.error("Purchase failed");
    }
  };

  // Handle cancel
  const handleCancel = async () => {
    try {
      await cancelListing();
      notification.success("Listing canceled!");
      setTimeout(() => refetchListing(), 2000);
    } catch (error) {
      console.error("Cancel failed:", error);
      notification.error("Cancel failed");
    }
  };

  const isOwner = owner?.toLowerCase() === connectedAddress?.toLowerCase();
  const isListed = listing?.isActive === true;
  const priceInEth = listing?.price ? formatEther(listing.price) : "0";
  const priceInUSD = ethPriceUSD > 0 ? (parseFloat(priceInEth) * ethPriceUSD).toFixed(2) : "0.00";

  return (
    <>
      <div className="card bg-base-100 shadow-xl">
        <figure className="px-10 pt-10">
          <div className="w-full h-48 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center">
            <span className="text-6xl font-bold text-white">#{tokenId}</span>
          </div>
        </figure>
        <div className="card-body">
          <h2 className="card-title">
            NFT #{tokenId}
            {isListed && <div className="badge badge-success">Listed</div>}
          </h2>

          <div className="text-sm">
            <p className="text-gray-600">Owner:</p>
            <Address address={owner} size="sm" />
          </div>

          {isListed && (
            <div className="stats shadow mt-2">
              <div className="stat p-4">
                {isLoadingPrice ? (
                  <button className="btn btn-secondary btn-sm loading" disabled>
                    Loading Price...
                  </button>
                ) : (
                  <>
                    <div className="stat-title text-xs">Price</div>
                    <div className="stat-value text-lg">{parseFloat(priceInEth).toFixed(4)} ETH</div>
                    {ethPriceUSD > 0 && <div className="stat-desc">~${priceInUSD} USD</div>}
                  </>
                )}
              </div>
            </div>
          )}

          <div className="card-actions justify-end mt-4">
            {!isOwner && isListed && (
              <button className="btn btn-primary btn-sm" onClick={handleBuy}>
                Buy Now
              </button>
            )}

            {isOwner && !isListed && !isApproved && !isApproving && (
              <button className="btn btn-secondary btn-sm" onClick={handleApprove}>
                Approve Marketplace
              </button>
            )}

            {isOwner && !isListed && isApproving && (
              <button className="btn btn-secondary btn-sm loading" disabled>
                Approving...
              </button>
            )}

            {isOwner && !isListed && isApproved && !isApproving && (
              <button className="btn btn-accent btn-sm" onClick={() => setShowListModal(true)}>
                List for Sale
              </button>
            )}

            {isOwner && isListed && (
              <button className="btn btn-error btn-sm" onClick={handleCancel}>
                Cancel Listing
              </button>
            )}
          </div>
        </div>
      </div>

      {/* List Modal */}
      {showListModal && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg">List NFT #{tokenId}</h3>
            <div className="form-control w-full mt-4">
              <label className="label">
                <span className="label-text">Price in ETH</span>
              </label>
              <input
                type="number"
                step="0.001"
                placeholder="0.5"
                className="input input-bordered w-full"
                value={listPrice}
                onChange={e => setListPrice(e.target.value)}
              />
              {listPrice && ethPriceUSD > 0 && (
                <label className="label">
                  <span className="label-text-alt">~${(parseFloat(listPrice) * ethPriceUSD).toFixed(2)} USD</span>
                </label>
              )}
            </div>
            <div className="modal-action">
              <button className="btn" onClick={() => setShowListModal(false)}>
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleList}>
                List NFT
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
