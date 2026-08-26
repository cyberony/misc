# Project Proposal Requirements

**Due Date:** Tuesday, January 20, at 11:00 PM  
**Points:** 10 points



## Submission Guidelines

- Submit your proposal **on Canvas** as a PDF or Markdown file
- Length: No page requirement or restriction, as long as the proposal is detailed and specific enough and not unreasonably long
- Use clear headings for each section
- Write in complete sentences and paragraphs
- Proofread your work before submission

---

## Tips

- **Be specific**: Vague project ideas are hard to implement. Clearly define the problem and the scope.
- **Think beyond LLMs**: Your project should leverage structured knowledge and reasoning in ways that ChatGPT or similar systems cannot easily replicate.
- **Start simple**: It's better to have a well-defined, focused project than an overly ambitious one.
- **Justify your choices**: For representation and reasoning, explain *why* your approach is suitable for your problem.
- **Consider feasibility**: Make sure you can realistically implement your project with available tools and data.

---

## Getting Started

Before you begin writing your proposal:
1. Reflect (in your mind) on problems you've encountered where existing AI tools fall short
2. Consider what type of knowledge would be needed to solve those problems
3. Think about how that knowledge could be structured, queried, and reasoned from
4. Review course materials on different knowledge representation methods (tables, FOPC, knowledge graphs, etc.)

---

## Proposal Requirements

Your proposal should include the following sections:

### 1. Project Idea (2 points)

Clearly describe the problem you want to solve and the solution you envision. Your description should:
- Explain the current limitation or problem you've identified
- Describe what your system will do
- Provide enough context for someone unfamiliar with the domain to understand the problem

**Example:**

> When I use GPS to go somewhere, if I want to find a McDonald's or something on the way, the GPS can't do that. It'll find the nearest such place, and that could be in a completely different direction of travel, often in the opposite direction. I want an AI that can do this.

### 2. What Your Project Accomplishes That LLMs Cannot (1 point)

Explain what your project will accomplish that can't be easily accomplished with a system like ChatGPT or Cursor. Consider:
- Why does this problem require structured knowledge and reasoning?
- What are the limitations of large language models (LLMs) for this task?
- What advantages does your knowledge-based approach provide?

**Example:**

> Contemporary LLM systems don't offer ways to connect them to GPS apps such as those on our phones, so the capability I'm envisioning must be achieved externally and requires knowledge of the target map to be represented in a structured way that enables reasoning from it in ways specific to the intended capability.

### 3. Type(s) of Knowledge Needed (2 points)

Identify and describe the types of knowledge your system will need. Be specific about:
- What information must be represented?
- What are the key entities, relationships, or patterns?
- Where will this knowledge come from (existing datasets, APIs, manual curation, etc.)?

**Example:**

> The knowledge I need is a map of locations and roads. This could be in a standard map format like how Bing Maps uses and offers via its application programming interface (API), for example, or a tree of nodes and edges where the nodes are places and the edges are roads that connect them.

### 4. Knowledge Representation Method(s) and Justification (2 points)

Describe how you will represent the knowledge in your system. Choose from methods covered in class:
- Tabular data (Pandas DataFrames)
- First-Order Predicate Logic (FOPC)
- Knowledge Graphs (RDF/OWL)
- Or a combination of these

**Justify your choice:** Explain why this representation is appropriate for your problem. What capabilities does it provide?

**Example:**

> The reason for this representation choice is that it will allow measuring distances between places and performing search to calculate routes if needed. While I intend to rely on an external GPS app for main pathfinding, I may still need to do auxiliary pathfinding to identify the best candidate places along my main route.

### 5. Type(s) of Reasoning and Justification (2 points)

Describe the reasoning your system will perform. This could include:
- Logical inference (deduction, abduction)
- Search algorithms (pathfinding, constraint satisfaction)
- Aggregation and statistical reasoning
- Rule-based reasoning
- Temporal or spatial reasoning

**Justify your choice:** Explain why this reasoning approach is suitable for your problem.

**Example:**

> For reasoning, I want to mainly leverage some GPS app's found path, which will be a sequence of nodes (places), then measure distance from that path and some potential nearby places, thereby ranking them by some "goodness" metric and pick accordingly. I chose this reasoning because it is distance-based and intuitive. I also envision using language generation to produce explanations for why my AI chose a certain place over another and other such explanations, as this can make the AI's decisions transparent.

### 6. Technologies and Tools (1 point)

List the technologies and tools you envision using for your project. This might include:
- Programming languages (Python, etc.)
- Libraries and frameworks (Pandas, pyDatalog, RDFLib, NetworkX, etc.)
- APIs or data sources
- Development tools

Be specific about what each tool will be used for in your project.

> For programming, I envision using Python and leverage the Bing Maps API. I also envision using the OpenAI API or connect with Cursor to leverage LLM capabilities to generate explanations.

### 7. Agentic AI Capabilities (Optional - 3 Extra Credit Points Later)

> **⚠️ Note:** Including this section in your proposal does not automatically earn you the 3 extra credit points. You will earn these points only if you successfully implement the agentic capabilities in your final project.

**What is Agentic AI?**

Agentic AI refers to systems that **reason about and choose** their actions to achieve goals, rather than simply executing pre-programmed sequences. This is a crucial distinction: traditional software follows fixed instructions you write ("if X, do Y"), while agentic AI uses knowledge and reasoning to decide what to do.

**Key characteristics of agentic AI:**
- **Dynamic decision-making**: The system reasons about WHAT to do next based on the current state, not following a fixed script
- **Goal-oriented flexibility**: It can take different paths to achieve a goal depending on context
- **Reasoning from knowledge**: It uses its knowledge representation to evaluate options and choose actions
- **Adaptability**: It changes strategy based on feedback, partial results, or changing conditions
- **Trade-off evaluation**: It can weigh multiple competing factors to make decisions

**Important:** Simply chaining together API calls or executing a sequence of pre-defined steps is NOT agentic - that's just traditional programming. Agentic systems must demonstrate actual reasoning and decision-making.

**Agentic AI in Your Project:**

To earn extra credit, describe how your project will incorporate genuine agentic capabilities. Your system should **reason and decide** - not just execute a predetermined sequence.

**Example:**

> My GPS assistant will act as an agent by reasoning about which actions to take based on the current situation:
> 
> - **Decision 1**: Given the user says "find a McDonald's," the agent queries its knowledge base about past user behavior and current context (time of day, route length). It **decides** whether to prioritize "closest to route" (if user is in a hurry based on appointment data) or "highest rated" (if there's time flexibility).
> 
> - **Decision 2**: When the initial search returns 3 candidates, the agent **reasons** about trade-offs: Option A is 1-minute detour with 2-star rating, Option B is 5-minute detour with 4-star rating, Option C is 3-minute detour with 3.5-star rating but has a drive-thru (user has kids in car based on calendar entry). The agent uses a learned preference model to **decide** which factors matter most in this context.
> 
> - **Decision 3**: If no suitable places are found, the agent **decides** whether to: (a) expand the search radius, (b) switch to a similar category (fast food → quick service restaurants), or (c) notify the user and ask for guidance. This decision is based on how critical the stop is and how much time is available.
> 
> - **Adaptation**: If the user frequently rejects the agent's suggestions for a certain type of place, it updates its preference model and adjusts its decision-making strategy for future searches.
> 
> The key is that the agent doesn't follow a fixed "do step 1, then step 2, then step 3" program. Instead, it continuously reasons about what to do next based on its knowledge and the current situation.

**What to Include:**

- Describe the **decisions** your system will make (not just the steps it executes)
- Explain **how it reasons** to make those decisions (what knowledge does it use? what factors does it weigh?)
- Show **flexibility**: How does it adapt based on different contexts or conditions?
- Demonstrate **trade-off evaluation**: How does it choose between competing options?
- Explain what makes this **genuinely agentic** rather than just a sequence of API calls

---

## Grading Rubric

| Section | Points |
|---------|--------|
| 1. Project Idea | 2 |
| 2. What Your Project Accomplishes That LLMs Cannot | 1 |
| 3. Type(s) of Knowledge Needed | 2 |
| 4. Knowledge Representation Method(s) and Justification | 2 |
| 5. Type(s) of Reasoning and Justification | 2 |
| 6. Technologies and Tools | 1 |
| 7. Agentic AI Capabilities (Optional) | 3 |
| **Total** | **10** |
| **Possible Total with Extra Credit** | **13** |

---
