import { Suspense } from "react";
import GameOverClientComponent from "./GameOverClientComponent";

export default function Page() {
  return (
    <Suspense fallback={<div>Loading results...</div>}>
      <GameOverClientComponent />
    </Suspense>
  );
}
