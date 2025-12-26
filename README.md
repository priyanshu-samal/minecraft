# Minecraft Civilization Bots 🤖🌲🏰

This project implements a **Multi-Agent Civilization** in Minecraft using autonomous bots powered by **Google Gemini** (LLM) and **LangChain**. The bots can gather resources, build, fight enemies, trade with an economy system, and even "reproduce" (spawn new agents) based on their social credit score.

## 🏗️ Architecture Stack

### Core Technologies
- **Runtime**: [Node.js](https://nodejs.org/)
- **Minecraft Client**: [Mineflayer](https://github.com/PrismarineJS/mineflayer) - Allows the bots to connect and interact with the Minecraft server.
- **AI Orchestration**: [LangChain](https://js.langchain.com/docs/) & [LangGraph](https://langchain-ai.github.io/langgraphjs/) - Manages the agent's decision-making loop and state.
- **LLM**: [Google Gemini 1.5 Flash](https://deepmind.google/technologies/gemini/) - Provides the intelligence for planning, reasoning, and generating actions.
- **Memory (RAG)**: [Pinecone](https://www.pinecone.io/) - Vector database for storing and retrieving past experiences, rules, and world knowledge (Retrieval Augmented Generation).
- **Embeddings**: Uses Google Generative AI Embeddings (`embedding-001`) to vectorize text for Pinecone.
- **Pathfinding**: `mineflayer-pathfinder` - Advanced A* pathfinding for navigating the 3D world.
- **PVP**: `mineflayer-pvp` - Combat logic for guards.

### Economy & Society
- **Economy System**: Tracks "Social Credit" or resources gathered by each bot. Stored in a local JSON database (`economy.json`).
- **Reproduction System**: Allows bots with high scores (Threshold: 50 credits) to spawn new agent instances via `child_process`, simulating population growth.

---

## 🔄 Logic Flow Diagram

The following diagram illustrates the lifecycle and decision loop of a single agent:

```mermaid
graph TD
    User -->|Start| Manager[Bot Manager (index.js)]
    Manager -->|Spawns| Bot[Mineflayer Bot]
    
    subgraph "Agent Logic Loop (LangGraph)"
        Bot -->|Events/Tick| Sense[Sense State (Inventory, Nearby Blocks)]
        Sense --> RAG[Retrieve Context]
        RAG -- Query State --> DB[(Pinecone Vector DB)]
        DB -- Similar Memories/Rules --> RAG
        RAG --> Plan[Plan Action]
        Plan -- Prompt + Context --> LLM[Gemini 1.5 Flash]
        LLM -- Action Plan (JSON) --> Plan
        Plan --> Execute[Execute Action]
    end
    
    Execute -- Move/Dig/Attack --> MC[Minecraft Server]
    Execute -- Deposit Log --> Economy[Economy Manager]
    Execute -- High Score? --> Reproduction[Reproduction Manager]
    Reproduction -->|Spawns New Process| Manager
    MC -->|Physics/Events| Bot
```

---

## ⚙️ Configuration & Environment

The bots are highly configurable. Create a `.env` file in the `bots` directory with the following variables:

### API Keys (Required)
| Variable | Description |
| :--- | :--- |
| `GEMINI_API_KEY` | Your Google Gemini API Key. |
| `PINECONE_API_KEY` | Your Pinecone Vector DB API Key. |
| `PINECONE_INDEX_HOST` | The Host URL for your Pinecone Index. |

### Bot Settings (Optional)
| Variable | Default | Description |
| :--- | :--- | :--- |
| `MC_HOST` | `localhost` | Minecraft Server Hostname/IP. |
| `MC_PORT` | `25565` | Minecraft Server Port. |
| `NUM_BOTS` | `1` | Number of bots to spawn initially. |
| `BOT_BASE_NAME` | `Villager` | Prefix for bot names (e.g. Villager_1). |
| `DECISION_INTERVAL_MS`| `30000` | How often (in ms) the AI "thinks" (runs the Graph). |

---

## 🧠 Application Logic Deep Dive

### 1. The Brain (`agentGraph.js` & `aiClient.js`)
The core logic is a **Graph** defined in `agentGraph.js`. It isn't a simple loop; it's a state machine:
*   **State Object**: Tracks `inventory`, `position`, `nearbyBlocks`, `memory`, `rules`, and `plan`.
*   **Nodes**:
    *   `sense`: Passthrough for initial state.
    *   `retrieve_rules`: Queries Pinecone for relevant context (e.g., "What do I do with logs?").
    *   `planner`: Constructs a prompt for Gemini, including the retrieved context and current state, and asks for a JSON action.

### 2. The Body (`botController.js` & `executor.js`)
*   **Roles**: Upon spawning, a bot is randomly assigned a role: `Lumberjack` (gatherer) or `Guard` (fighter).
*   **Sensing**: The bot scans the world for specific blocks (Logs) within a 16-block radius to optimize tokens sent to the LLM.
*   **Execution**: The JSON plan from Gemini (e.g., `{"action": "collect", "target": {"x": 100...}}`) is mapped to Mineflayer functions:
    *   `collect`: Uses A* pathfinding to reach the tree, then safely stands near it and digs.
    *   `deposit`: Finds a nearby chest and dumps resource items.
    *   `attack`: Uses PVP plugin to engage hostile mobs.

### 3. Memory & RAG (`rag/memoryManager.js`)
Bots don't just react; they remember. Important events are stored in Pinecone:
*   **Ingestion**: When a bot chops a tree or accesses a chest, an event is logged with `importance` and `coordinates`.
*   **Retrieval**: Before making a decision, the bot queries Pinecone. If it's near a forest where it previously chopped wood, it might "remember" that location.

### 4. Reproduction (`reproductionManager.js`)
*   If a bot's `social credit score` (tracked in `economy.json`) exceeds **50**, it triggers a `reproduce` action.
*   This spawns a **new child process** running a fresh bot instance, incrementally named (e.g., `Villager_1_Child1`).
*   This simulates organic population growth based on economic success.

## 🚀 Setup & Installation

1.  **Clone the repository**:
    ```bash
    git clone <repository_url>
    cd f:/Minecraft-civilization
    ```

2.  **Install dependencies**:
    ```bash
    cd bots
    npm install
    ```

3.  **Configure Environment**:
    Fill in your `.env` file as described in the Configuration section.

4.  **Run the bots**:
    ```bash
    npm start
    ```

## 📂 Project Structure

```text
f:/Minecraft-civilization/
├── bots/
│   ├── index.js            # Entry point. Launches bots.
│   ├── botController.js    # Manages a single bot instance and its event listeners.
│   ├── agentGraph.js       # Defines the LangGraph state machine (Sense -> Plan -> Act).
│   ├── executor.js         # Translates planned actions into Mineflayer API calls.
│   ├── economyManager.js   # Tracks bot scores and contributions (JSON DB).
│   ├── reproductionManager.js # Handles spawning new bots.
│   ├── aiClient.js         # Interface between bot loop and Agent Graph.
│   ├── rag/
│   │   ├── memoryManager.js # Pinecone interaction (ingest/retrieve) and embeddings.
│   │   └── embeddings.js   # Google Generative AI Embeddings wrapper.
│   └── .env                # API keys and config.
```

---

**Happy Hacking!** ⛏️💎
