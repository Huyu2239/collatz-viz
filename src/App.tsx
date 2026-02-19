import { useState, useMemo } from "react";
import { buildTree } from "./collatz/tree";
import { computeLayout } from "./collatz/layout";
import Canvas from "./components/Canvas";
import Header from "./components/Header";

export default function App() {
  const [maxNumber, setMaxNumber] = useState(1000);

  const layout = useMemo(() => {
    const tree = buildTree(maxNumber);
    return computeLayout(tree);
  }, [maxNumber]);

  return (
    <>
      <Header maxNumber={maxNumber} onChange={setMaxNumber} />
      <Canvas layout={layout} />
    </>
  );
}
