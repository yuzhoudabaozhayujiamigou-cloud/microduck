import { useEffect, useRef, useState } from "react";
import { COLOURS, type ColourId } from "../data";
import { colourToVariant, createDuckScene, type DuckHandle, type DuckPolicy } from "../duck/scene";
import { cssVars } from "./ui";

type Props = {
  colour?: ColourId;
  mode?: "showcase" | "colourways";
  policy?: DuckPolicy;
  follow?: boolean;
  quack?: boolean;
  label: string;
};

export function DuckScene({ colour = "classic", mode, policy = "aim", follow = true, quack: canQuack = true, label }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<DuckHandle | null>(null);
  const colourRef = useRef(colour);
  colourRef.current = colour;
  const policyRef = useRef(policy);
  policyRef.current = policy;
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resolved = mode ?? (follow && canQuack ? "showcase" : "colourways");

  useEffect(() => {
    const el = host.current;
    if (!el) return;
    let disposed = false;
    let handle: DuckHandle | null = null;
    setReady(false);
    setError(null);
    const startColour = colourRef.current;
    createDuckScene(el, resolved, startColour)
      .then((next) => {
        if (disposed) {
          next.dispose();
          return;
        }
        handle = next;
        api.current = next;
        if (resolved === "colourways") {
          if (colourRef.current !== startColour) next.setVariant(colourToVariant(colourRef.current));
          next.setPolicy(policyRef.current);
        }
        setReady(true);
      })
      .catch((err: unknown) => {
        if (disposed) return;
        setError(err instanceof Error ? err.message : "Could not wake the duck");
      });
    return () => {
      disposed = true;
      api.current = null;
      handle?.dispose();
    };
  }, [resolved]);

  useEffect(() => {
    if (resolved !== "colourways") return;
    api.current?.setVariant(colourToVariant(colour));
  }, [colour, resolved]);

  useEffect(() => {
    if (resolved !== "colourways") return;
    api.current?.setPolicy(policy);
  }, [policy, resolved, ready]);

  return (
    <div className="duck-stage" style={cssVars({ "--sunburst-tint": COLOURS.find((item) => item.id === colour)?.head ?? "#f7e6cb" })}>
      <div className="sunburst" aria-hidden="true" />
      {!ready && !error && (
        <div className="wake">
          <span className="spinner" />
          Waking up the duck…
        </div>
      )}
      {error && (
        <div className="wake" role="status">
          {error}
        </div>
      )}
      <div
        ref={host}
        aria-label={label}
        style={{ position: "absolute", inset: 0, touchAction: "pan-y", cursor: resolved === "showcase" || canQuack ? "pointer" : "default" }}
      />
    </div>
  );
}
