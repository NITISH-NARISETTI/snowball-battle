"use client";

import { DiscoveryV1Api, Region } from "@hathora/hathora-cloud-sdk";
import { useEffect, useState } from "react";

const discoveryClient = new DiscoveryV1Api();

const getRegionLatency = ({ region, host, port }) =>
  new Promise<{ region: string; latency: number }>((resolve) => {
    const latencies: number[] = [];
    let start1: number;

    const socket = new WebSocket(`wss://${host}:${port}`);

    const timeout = setTimeout(() => {
      socket.close();
      resolve({ region, latency: Infinity });
    }, 10000);

    socket.addEventListener("open", () => {
      start1 = Date.now();
      socket.send("ping");
    });

    socket.addEventListener("message", (event) => {
      if (event.data === "ping") {
        const latency = Date.now() - start1;
        resolve({ region, latency });
        clearTimeout(timeout);
        socket.close();
      }
    });
  });

type Latencies = {
  region: Region;
  latency: number;
}[];

let cachedLatencies: Promise<Latencies> | undefined;

async function getLatencies() {
  const pingServers = await discoveryClient.getPingServiceEndpoints();
  const regionLatencies = (await Promise.all(
    pingServers.map(getRegionLatency)
  )) as {
    region: Region;
    latency: number;
  }[];
  return regionLatencies;
}

export function useRegionLatencies() {
  const [latencies, setLatencies] = useState<
    {
      region: Region;
      latency: number;
    }[]
  >();

  useEffect(() => {
    if (!cachedLatencies) {
      cachedLatencies = getLatencies();
    }
    cachedLatencies.then(setLatencies);
  }, []);

  return {
    getLatency(region: Region) {
      return (
        latencies?.find((latency) => latency.region === region)?.latency ?? 0
      );
    },
  };
}
