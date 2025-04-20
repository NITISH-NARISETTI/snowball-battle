import { Suspense } from "react";
import GameClientComponent from "./GameClientComponent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading game...</div>}>
      <GameClientComponent />
    </Suspense>
  );
}
