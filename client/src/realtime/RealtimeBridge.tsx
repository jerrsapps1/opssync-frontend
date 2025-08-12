import React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { connectSSE } from "./sse";

export default function RealtimeBridge() {
  const qc = useQueryClient();
  React.useEffect(() => {
    const connection = connectSSE(qc);
    return () => connection.close();
  }, [qc]);
  return null;
}
