import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { coreTools } from "./coreTools.js";
import { witTools } from "./witTools.js";
import { repoTools } from "./repoTools.js";
import { buildTools } from "./buildTools.js";
import { wikiTools } from "./wikiTools.js";
import { searchTools } from "./searchTools.js";
import { workTools } from "./workTools.js";

/**
 * All available tools aggregated from different domains
 */
export const allTools: Tool[] = [
  ...coreTools,
  ...witTools,
  ...repoTools,
  ...buildTools,
  ...wikiTools,
  ...searchTools,
  ...workTools,
];

export { coreTools, witTools, repoTools, buildTools, wikiTools, searchTools, workTools };
