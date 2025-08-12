import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSSE } from "./sse";

export default function RealtimeBridge() {
  const qc = useQueryClient();
  React.useEffect(() => {
    const es = connectSSE(qc);
    return () => es.close();
  }, [qc]);
  return null;
}
