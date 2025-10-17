"use client";

import { useMemo, useState } from "react";
import type { NextPage } from "next";
import { formatEther } from "viem";
import { useAccount } from "wagmi";
import { Address } from "~~/components/scaffold-eth";
import { useScaffoldEventHistory } from "~~/hooks/scaffold-eth";

const Events: NextPage = () => {
  const { isConnected } = useAccount();
  const [eventType, setEventType] = useState<"token" | "nft">("token");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Search filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Get token transfer events
  const { data: tokenEvents, isLoading: tokenLoading } = useScaffoldEventHistory({
    contractName: "MyToken",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: false,
  });

  // Get NFT transfer events
  const { data: nftEvents, isLoading: nftLoading } = useScaffoldEventHistory({
    contractName: "MyNFT",
    eventName: "Transfer",
    fromBlock: 0n,
    watch: false,
  });

  // Determine which events to show based on selected tab
  const currentEvents = eventType === "token" ? tokenEvents || [] : nftEvents || [];
  const isLoading = eventType === "token" ? tokenLoading : nftLoading;

  // Filter events based on search term
  const filteredEvents = useMemo(() => {
    if (!searchTerm.trim()) return currentEvents;

    return currentEvents.filter(event => {
      const searchLower = searchTerm.toLowerCase();

      // Check if search term matches from address
      if (event.args.from?.toLowerCase().includes(searchLower)) return true;

      // Check if search term matches to address
      if (event.args.to?.toLowerCase().includes(searchLower)) return true;

      // Check if search term matches token ID (for NFTs) or amount (for tokens)
      if (eventType === "nft") {
        const tokenId = event.args[2]?.toString();
        if (tokenId?.includes(searchTerm)) return true;
      } else {
        const amount = formatEther(event.args[2] || 0n);
        if (amount.includes(searchTerm)) return true;
      }

      // Check if search term matches block number
      if (event.log.blockNumber.toString().includes(searchTerm)) return true;

      // Check if search term matches transaction hash
      if (event.log.transactionHash.toLowerCase().includes(searchLower)) return true;

      return false;
    });
  }, [currentEvents, searchTerm, eventType]);

  // Pagination calculations
  const totalPages = Math.ceil(filteredEvents.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

  // Reset to first page when filters change
  const handleEventTypeChange = (type: "token" | "nft") => {
    setEventType(type);
    setCurrentPage(1);
  };

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
  };

  // Show connection prompt if wallet not connected
  if (!isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="card w-96 bg-base-100 shadow-xl">
          <div className="card-body text-center">
            <h2 className="card-title justify-center">Contract Events</h2>
            <p>Please connect your wallet to view events</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-center mb-4">📜 Contract Events</h1>
        <p className="text-center text-gray-600">View transaction history for your contracts</p>
      </div>

      {/* Event type tabs */}
      <div className="flex justify-center mb-6">
        <div className="tabs tabs-boxed">
          <button
            className={`tab ${eventType === "token" ? "bg-base-100 primary-content" : ""}`}
            onClick={() => handleEventTypeChange("token")}
          >
            Token Transfers ({tokenEvents?.length || 0})
          </button>
          <button
            className={`tab ${eventType === "nft" ? "bg-base-100 primary-content" : ""}`}
            onClick={() => handleEventTypeChange("nft")}
          >
            NFT Activity ({nftEvents?.length || 0})
          </button>
        </div>
      </div>

      {/* Events table */}
      <div className="card bg-base-100 shadow-xl">
        <div className="card-body">
          <div className="flex justify-between">
            <h2 className="card-title">{eventType === "token" ? "🪙 Token Events" : "🎨 NFT Events"}</h2>
            <div className="form-control w-full md:w-auto">
              <div className="input-group">
                <input
                  type="text"
                  placeholder={`Search by address, ${
                    eventType === "nft" ? "token ID" : "amount"
                  }, block, or tx hash...`}
                  className="input input-bordered w-full md:w-96"
                  value={searchTerm}
                  onChange={e => handleSearchChange(e.target.value)}
                />
                {searchTerm && (
                  <button className="btn btn-ghost" onClick={() => handleSearchChange("")}>
                    ✕
                  </button>
                )}
              </div>
            </div>
          </div>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          ) : paginatedEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchTerm ? (
                <>
                  <p>No events match your search</p>
                  <p className="text-sm">Try adjusting your search terms</p>
                </>
              ) : (
                <>
                  <p>No events found</p>
                  <p className="text-sm">
                    {eventType === "token"
                      ? "Transfer some tokens to see events here"
                      : "Mint some NFTs to see events here"}
                  </p>
                </>
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="table table-zebra">
                  <thead>
                    <tr>
                      <th>From</th>
                      <th>To</th>
                      <th>{eventType === "token" ? "Amount" : "Token ID"}</th>
                      <th>Block</th>
                      <th>Transaction</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedEvents.map((event, index) => (
                      <tr key={`${event.log.transactionHash}-${index}`}>
                        <td>
                          <Address address={event.args.from} size="sm" />
                        </td>
                        <td>
                          <Address address={event.args.to} size="sm" />
                        </td>
                        <td>
                          {eventType === "token" ? (
                            <span className="font-mono">
                              {Number(formatEther(event.args[2] || 0n)).toFixed(4)} LSEA
                            </span>
                          ) : (
                            <span className="badge badge-primary">#{event.args[2]?.toString()}</span>
                          )}
                        </td>
                        <td>
                          <span className="text-sm">{event.log.blockNumber.toString()}</span>
                        </td>
                        <td>
                          <a
                            href={`https://sepolia-blockscout.lisk.com/tx/${event.log.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-xs btn-outline"
                          >
                            View →
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between items-center gap-2 mt-6">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-300">Show:</span>
                  <select
                    className="select select-bordered select-sm"
                    value={itemsPerPage}
                    onChange={e => handleItemsPerPageChange(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-300">per page</span>
                </div>
                <div className="flex justify-center items-center gap-4">
                  <button
                    className="btn btn-sm btn-outline rounded-lg"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                  >
                    &laquo; Previous
                  </button>

                  <button
                    className="btn btn-sm btn-outline rounded-lg"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                  >
                    Next &raquo;
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Events;
