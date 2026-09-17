import { NextResponse } from "next/server";
import { SpecializedAgentRegistry } from "@/server/ai/agents/agent-registry";

// Ensure agents are imported
import "@/server/ai/agents/workforce.agent";
import "@/server/ai/agents/procurement.agent";
import "@/server/ai/agents/fleet.agent";
import "@/server/ai/agents/project.agent";
import "@/server/ai/agents/crm.agent";
import "@/server/ai/agents/qhse.agent";
import "@/server/ai/agents/finance.agent";
import "@/server/ai/agents/platform.agent";

export async function GET() {
  const agents = SpecializedAgentRegistry.listAgents();
  // Sync to DB
  SpecializedAgentRegistry.syncDatabaseDefinitions().catch(() => {});
  return NextResponse.json({ agents });
}
