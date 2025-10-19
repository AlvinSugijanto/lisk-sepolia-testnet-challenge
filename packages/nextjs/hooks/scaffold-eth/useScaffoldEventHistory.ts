import { useEffect, useMemo, useState } from "react";
import { useTargetNetwork } from "./useTargetNetwork";
import { Abi, AbiEvent, ExtractAbiEventNames } from "abitype";
import { useInterval } from "usehooks-ts";
import { Hash } from "viem";
import * as chains from "viem/chains";
import { usePublicClient } from "wagmi";
import { useDeployedContractInfo } from "~~/hooks/scaffold-eth";
import scaffoldConfig from "~~/scaffold.config";
import { replacer } from "~~/utils/scaffold-eth/common";
import {
  ContractAbi,
  ContractName,
  UseScaffoldEventHistoryConfig,
  UseScaffoldEventHistoryData,
} from "~~/utils/scaffold-eth/contract";

// Tambahkan interface untuk progress
interface FetchProgress {
  fetchCount: number;
  fetchMax: number;
}

/**
 * Reads events from a deployed contract
 * @param config - The config settings
 * @param config.contractName - deployed contract name
 * @param config.eventName - name of the event to listen for
 * @param config.fromBlock - the block number to start reading events from
 * @param config.filters - filters to be applied to the event (parameterName: value)
 * @param config.blockData - if set to true it will return the block data for each event (default: false)
 * @param config.transactionData - if set to true it will return the transaction data for each event (default: false)
 * @param config.receiptData - if set to true it will return the receipt data for each event (default: false)
 * @param config.watch - if set to true, the events will be updated every pollingInterval milliseconds set at scaffoldConfig (default: false)
 * @param config.enabled - set this to false to disable the hook from running (default: true)
 * @param config.setProgress - callback function to update progress
 */
export const useScaffoldEventHistory = <
  TContractName extends ContractName,
  TEventName extends ExtractAbiEventNames<ContractAbi<TContractName>>,
  TBlockData extends boolean = false,
  TTransactionData extends boolean = false,
  TReceiptData extends boolean = false,
>({
  contractName,
  eventName,
  fromBlock,
  filters,
  blockData,
  transactionData,
  receiptData,
  watch,
  enabled = true,
  setProgress,
}: UseScaffoldEventHistoryConfig<TContractName, TEventName, TBlockData, TTransactionData, TReceiptData> & {
  setProgress?: (progress: FetchProgress | null) => void;
}) => {
  const [events, setEvents] = useState<any[]>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [progressState, setProgressState] = useState<FetchProgress | null>(null);

  const { data: deployedContractData, isLoading: deployedContractLoading } = useDeployedContractInfo(contractName);
  const publicClient = usePublicClient();
  const { targetNetwork } = useTargetNetwork();

  // Update progress baik melalui callback maupun internal state
  const updateProgress = (progress: FetchProgress | null) => {
    setProgressState(progress);
    if (setProgress) {
      setProgress(progress);
    }
  };

  // solution 2 (dynamically fetch data from latest block for 99999n block and loop through max 10 times)
  const readEvents = async () => {
    setIsLoading(true);
    try {
      if (!deployedContractData || !enabled || !publicClient) return;

      const event = (deployedContractData.abi as Abi).find(
        part => part.type === "event" && part.name === eventName,
      ) as AbiEvent;

      if (!event) {
        throw new Error(`Event ${eventName} not found in contract ABI`);
      }

      const currentBlock = await publicClient.getBlockNumber({ cacheTime: 0 });
      const BLOCK_CHUNK = 99999n;
      const MAX_FETCH = 10;

      let allEvents: any[] = [];
      let toBlock = currentBlock;
      let fetchCount = 0;

      while (fetchCount < MAX_FETCH && toBlock > 0n) {
        const fromBlock = toBlock - BLOCK_CHUNK > 0n ? toBlock - BLOCK_CHUNK : 0n;

        const currentProgress: FetchProgress = {
          fetchCount: fetchCount + 1,
          fetchMax: MAX_FETCH,
        };

        updateProgress(currentProgress);

        console.log(`Fetch ${fetchCount + 1}: blocks ${fromBlock} - ${toBlock}`);

        const logs = await publicClient.getLogs({
          address: deployedContractData.address,
          event,
          args: filters as any,
          fromBlock,
          toBlock,
        });

        const processedEvents = await processLogs(
          logs,
          blockData ?? false,
          transactionData ?? false,
          receiptData ?? false,
          publicClient,
        );
        allEvents = [...processedEvents, ...allEvents]; // Prepend untuk urutan chronologis

        setEvents([...allEvents]);
        fetchCount++;

        // Stop jika sudah sampai block 0
        if (fromBlock === 0n) break;

        // Mundur ke chunk sebelumnya
        toBlock = fromBlock - 1n;

        // Delay
        if (toBlock > 0n) await new Promise(resolve => setTimeout(resolve, 100));
      }

      console.log(`Fetched ${allEvents.length} events from ${fetchCount} requests`);
      setError(undefined);
      updateProgress(null); // Reset progress ketika selesai
    } catch (e: any) {
      console.error("Error:", e);
      setError(e.message);
      updateProgress(null); // Reset progress ketika error
    } finally {
      setIsLoading(false);
    }
  };

  const processLogs = async (
    logs: any[],
    blockData: boolean,
    transactionData: boolean,
    receiptData: boolean,
    publicClient: any,
  ) => {
    const chunkEvents = [];

    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i];
      const eventData = {
        log: log,
        args: log.args,
      };

      if (blockData || transactionData || receiptData) {
        const [block, transaction, receipt] = await Promise.all([
          blockData && log.blockHash !== null
            ? publicClient.getBlock({ blockHash: log.blockHash as Hash }).catch(() => null)
            : null,
          transactionData && log.transactionHash !== null
            ? publicClient.getTransaction({ hash: log.transactionHash as Hash }).catch(() => null)
            : null,
          receiptData && log.transactionHash !== null
            ? publicClient.getTransactionReceipt({ hash: log.transactionHash as Hash }).catch(() => null)
            : null,
        ]);

        chunkEvents.push({
          ...eventData,
          block,
          transaction,
          receipt,
        });
      } else {
        chunkEvents.push(eventData);
      }
    }

    return chunkEvents;
  };

  useEffect(() => {
    if (!deployedContractLoading && deployedContractData && publicClient) {
      readEvents();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    publicClient,
    contractName,
    eventName,
    deployedContractLoading,
    deployedContractData?.address,
    deployedContractData,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    JSON.stringify(filters, replacer),
    blockData,
    transactionData,
    receiptData,
    enabled,
  ]);

  useEffect(() => {
    // Reset the internal state when target network or fromBlock changed
    setEvents([]);
    setError(undefined);
    updateProgress(null);
  }, [fromBlock, targetNetwork.id]);

  useInterval(
    async () => {
      if (!deployedContractLoading && publicClient) {
        readEvents();
      }
    },
    watch ? (targetNetwork.id !== chains.hardhat.id ? scaffoldConfig.pollingInterval : 10_000) : null,
  );

  const eventHistoryData = useMemo(
    () =>
      events?.map(addIndexedArgsToEvent) as UseScaffoldEventHistoryData<
        TContractName,
        TEventName,
        TBlockData,
        TTransactionData,
        TReceiptData
      >,
    [events],
  );

  return {
    data: eventHistoryData,
    isLoading: isLoading,
    error: error,
    progress: progressState, // Export progress state
  };
};

export const addIndexedArgsToEvent = (event: any) => {
  if (event.args && !Array.isArray(event.args)) {
    return { ...event, args: { ...event.args, ...Object.values(event.args) } };
  }

  return event;
};
