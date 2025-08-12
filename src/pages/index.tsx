"use client";

import { CSSProperties, useState, useRef, useEffect } from "react";
import Header from "../components/custom_components/header";
import Footer from "../components/custom_components/footer";
import CollapsibleBox from "../components/custom_components/CollapsibleBox";
import React from "react";
import ApiKeySheet from "../components/custom_components/ApiKeySheet";
import ToolsSheet from "../components/custom_components/ToolsSheet";
import { Block, Variable } from "@/types/types";
import usePromptStore from "../lib/store";
import { api } from "@/tools/api";
import { AgentBlockRef } from "../components/custom_components/AgentBlock";
import posthog from "posthog-js";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
} from "@/components/ui/table";
// import { Button } from "@/components/ui/button"; // commented out
// import { useSourceStore } from "@/lib/store";
import { useRouter } from "next/router";
import { auth } from "@/tools/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useAgentStore } from "@/lib/agentStore";
import AgentHeader from "@/components/custom_components/AgentHeader";
import { SaveOutlined } from "@ant-design/icons";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import CheckInBlock from "../components/custom_components/CheckInBlock";
import ContactBlock from "@/components/custom_components/ContactBlock";
import TransformBlock from "../components/custom_components/TransformBlock";
// import { useBlockManager } from "@/hooks/useBlockManager";
import AgentBlock from "../components/custom_components/AgentBlock";
import { useBlockManager } from "@/hooks/useBlockManager";
// import { getBlockList } from "../lib/store";
import SearchAgent from "@/components/custom_components/SearchAgent";
import Layout from "@/components/Layout";
import Notebook from "@/pages/notebook/index";

const pageStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  minHeight: "100vh",
  backgroundColor: "#141414",
  color: "#f3f4f6",
};

const mainStyle: CSSProperties = {
  flex: "1",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  gap: "16px",
};

export default function Home() {
  const router = useRouter();
  const { agentId } = router.query;

  useEffect(() => {
    if (agentId) {
      router.push(`/notebook?agentId=${agentId}`);
    } else {
      router.push("/agents");
    }
  }, [router, agentId]);

  return null;

  // Commented out previous implementation
  // return (
  //   <Layout>
  //     <Notebook />
  //   </Layout>
  // );
}
