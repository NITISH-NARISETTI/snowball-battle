// client/src/app/game/GameClientComponent.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import { start } from "./game";
import { useRouter, useSearchParams } from "next/navigation";
import { ScoreBoard } from "./scoreboard";
import { Button } from "@/components/ui/button";
import { UnplugIcon } from "lucide-react";
import Link from "next/link";
import { SantaColor } from "@/lib/player-options";
import { getRoomIdByShortCode, getShortCodeByRoomId } from "@/services/room";

export type Score = {
  kills: number;
  deaths: number;
  player: string;
  nickname: string;
  santaColor: SantaColor;
};

const KILL_LOG_DISPLAY_MAX = 5;
const KILL_LOG_TIMEOUT = 3000;

type KillLog = {
  id: string;
  victim: string;
  killer: string;
};

export default function GameClientComponent() {
  const params = useSearchParams();
  const [scores, setScores] = useState<Score[]>([]);
  const [killLog, setKillLog] = useState<KillLog[]>([]);
  const router = useRouter();
  const playerIdRef = useRef<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [latency, setLatency] = useState(0);
  const [roomCode, setRoomCode] = useState<string>("");

  async function setRoomShortCode(roomId: string) {
    const roomCode = await getShortCodeByRoomId(roomId);
    if (!roomCode) {
      setRoomCode("not found");
      return;
    }
    setRoomCode(roomCode);
  }

  useEffect(() => {
    const roomId = params.get("roomId");
    if (!roomId) return;

    setRoomShortCode(roomId);

    const game = start({
      roomId,
      onScoresUpdated(newScores: Score[]) {
        setScores(newScores);
      },
      onGameOver(winner: string) {
        router.push(`/game-over?winner=${winner}`);
      },
      onDisconnect() {
        router.push(`/disconnect`);
      },
      onTimeLeft(newTimeLeft) {
        setTimeLeft(newTimeLeft);
      },
      onDeath(victim: string, killer: string) {
        setKillLog((prev) => [
          ...prev,
          {
            id: Math.random().toString(16).slice(2),
            victim: victim,
            killer: killer,
          },
        ]);
        setTimeout(() => {
          setKillLog((prev) => prev.slice(1));
        }, KILL_LOG_TIMEOUT);
      },
      setLatency,
      playerIdRef,
    });

    return () => {
      game.then(({ cleanup }) => {
        cleanup();
      });
    };
  }, [params]);

  return (
    <main className="relative">
      <canvas id="canvas" className="cursor-none"></canvas>
      <div className="absolute top-4 right-4 select-none">
        <ScoreBoard scores={scores} myPlayerId={playerIdRef.current} />
      </div>
      <div className="absolute top-4 left-4 flex gap-2">
        <Link href="/disconnect">
          <Button
            variant={"secondary"}
            className="flex gap-4 z-10 relative select-none"
          >
            <UnplugIcon /> Disconnect
          </Button>
        </Link>
        <div className="text-black bg-white border border-black rounded w-fit p-2 select-none">
          {latency} ms
        </div>
        <div className="text-black bg-white border border-black rounded w-fit p-2 select-none">
          Code: {roomCode}
        </div>
      </div>
      <div className="absolute top-4 flex justify-center w-full select-none">
        <div className="rounded-xl p-4 py-2 text-xs bg-gray-900 text-white">
          {Math.floor(timeLeft / 1000)} seconds remaining
        </div>
      </div>
      {killLog.length > 0 && (
        <div className="absolute bottom-4 left-4 flex w-3/4 select-none">
          <div className="rounded-sm p-4 text-white bg-gray-900/75">
            {killLog.map((log, idx) => {
              if (idx >= KILL_LOG_DISPLAY_MAX) return;
              return (
                <div key={log.id} className="flex gap-2">
                  <span className="text-red-500 font-extrabold">
                    💀 {log.killer}
                  </span>
                  <span className="text-white"> killed </span>
                  <span className="text-blue-300 font-extrabold">
                    {log.victim}!
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </main>
  );
}
