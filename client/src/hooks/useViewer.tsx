import { createContext, ReactNode, useContext, useState } from "react";
import ImageViewer from "../components/ImageViewer";

interface ViewerCtx { open: (id: string) => void; /** increments whenever an image is changed or deleted */ tick: number }
const Ctx = createContext<ViewerCtx | null>(null);

export function ViewerProvider({ children }: { children: ReactNode }) {
  const [id, setId] = useState<string | null>(null);
  const [tick, setTick] = useState(0);
  return (
    <Ctx.Provider value={{ open: setId, tick }}>
      {children}
      {id && <ImageViewer id={id} onClose={() => setId(null)} onChanged={() => setTick((t) => t + 1)} />}
    </Ctx.Provider>
  );
}

export function useViewer() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useViewer must be used inside ViewerProvider");
  return c;
}
