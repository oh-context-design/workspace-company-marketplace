# Araba Commands

Reference list of all commands available through the Araba agent. Use "help" to see this list at any time.

## Built-in Commands

These are handled directly by Araba without routing to another skill.

1. **status** -- Check whether the Slack messenger listener process is running. Reports active or inactive.

2. **ping** -- Quick health check. Confirms Araba is online and reports how many commands are available.

3. **help** -- Show this command list with descriptions.

## Routed Commands

These dispatch to specialist skills. Any text after the command name is forwarded as context.

4. **pipeline** -- Open the agent delegation pipeline reference. Shows the architect, engineer, reviewer workflow used for engineering tasks.

5. **design** -- Launch the design review orchestrator. Routes to specialist reviewers for web (React, Tailwind, Framer Motion) and iOS (SwiftUI, HIG) platforms based on file type.

6. **cleanup** -- Ship your work. Runs smart git operations, marketplace sync, and cache management. Detects stale plugin versions and offers cleanup.

7. **sprint** -- Start sprint planning. Combines Addy (engineering classification) and Alara (design classification) with calendar scheduling for the current cycle.

8. **addy** -- Talk to the Engineering Lead. Force multiplier for engineering teams. Handles code quality, delivery planning, team coordination, and cognitive diversity via Codex.

9. **alara** -- Talk to the Product Engineer. Design leadership and product strategy. Partners with Addy to ship beautiful products.

10. **python** -- Launch the Python development orchestrator. Routes to Python architect, engineer, code reviewer, and security reviewer.

11. **coach** -- Start life coaching. Unified coaching orchestrator with Atomic Habits and Altman principles. Routes to spiritual, wellness, and utility sub-agents.

12. **finance** -- Start financial coaching. Budget tracking, debt payoff strategy, micro-savings wins, and spending ritual reviews.

13. **gemini** -- Run design analysis through Google Gemini CLI. Provides cognitive diversity alongside Claude for design critique, visual hierarchy, and UI decisions.

14. **codex** -- Run strategic analysis through OpenAI Codex CLI. Provides cognitive diversity alongside Claude for architecture decisions, build vs buy, and implementation review.
