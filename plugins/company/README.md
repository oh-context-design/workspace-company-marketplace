# Company Plugin

**Version:** 2.6.0
**Description:** Executive suite for strategic decision-making with design-first board orchestration.

## Team Structure

See `team-members.json` in the strategic-framework skill for complete team structure, executive sponsorship, peer relationships, and decision tree.

**Location:** `${CLAUDE_PLUGIN_ROOT}/skills/strategic-framework/team-members.json`

```
Board (cyan) - Design-First Executive Council
├── CEO - Strategy (lens in Board)
├── CTO - Technology (sponsors Addy)
├── CFO - Finance (lens in Board)
└── CDO - Design Excellence (sponsors Alara)

Execution Leads (Equal Peers)
├── Addy (blue) - Engineering Lead
│   └── Manages: Swift, Python, TypeScript
└── Alara (purple) - Product Engineer
    └── Manages: Design reviewers

Coordination
└── Sprint (cyan) - Orchestrates Addy + Alara
```

## Commands

1. **`/company:board`** - Design-first executive council. CDO perspective leads, CEO/CTO/CFO support. Routes strategic decisions through design lens.

2. **`/company:addy`** - Engineering Lead and force multiplier. Partners with Alara. Sponsored by CTO. Coordinates Swift, Python, TypeScript specialists.

3. **`/company:alara`** - Product Engineer applying Jobs/Ive/Rams principles. Partners with Addy. Sponsored by CDO. "Should we build this?"

4. **`/company:sprint`** - Sprint planning orchestrator. Coordinates Addy + Alara for issue classification and calendar scheduling.

## Agents

### Board Agent (`company-board.md`)
Design-first executive council with CDO perspective leading every decision. Uses Rams' 10 principles, strategic reflection patterns, conflict resolution favoring design excellence.

### Addy Agent (`company-addy-engineering-lead.md`)
Engineering Lead and force multiplier. Blue color. Peer partnership with Alara. CTO sponsor. Manages Swift, Python, TypeScript teams.

### Alara Agent (`company-alara-product-engineer.md`)
Product Engineer with Jobs/Ive/Rams principles. Purple color. Peer partnership with Addy. CDO sponsor. Manages design reviewers. Strategic product decisions.

### Sprint Agent (`company-sprint.md`)
Sprint planning orchestrator. Cyan color. Coordinates Addy + Alara for parallel issue classification, calendar scheduling via Google Calendar MCP, Linear integration.

## Skills

### strategic-framework
Executive decision-making frameworks:
- `references/ceo-leadership.md` - Leadership philosophies (Cook, Field, Bezos)
- `references/cto-frameworks.md` - Technology decision frameworks
- `references/cfo-financial.md` - Financial metrics and models (Deming + Parekh)
- `references/cdo-design.md` - Design principles (Ive, Rams)
- `references/decision-frameworks.md` - SWOT, OKRs, OODA Loop
- `references/compounding-engineering.md` - AI-native engineering practices

## Usage Examples

```bash
# Strategic decision through design lens
/company:board Should we pivot to a new platform?

# Engineering execution
/company:addy Is the team ready to ship this feature?

# Product strategy
/company:alara Is this feature worth building?

# Sprint planning
/company:sprint Plan my sprint for next week
/company:sprint status
/company:sprint velocity
```

## Integration

- **Board** → Escalation point for Addy and Alara disagreements
- **Addy** → Routes to Swift/Python/TypeScript specialists
- **Alara** → Routes to design plugin reviewers
- **Sprint** → Uses Linear MCP, Google Calendar MCP, Notion MCP

## Version History

- **2.6.0** (2025-01-05): Consolidate Luna → Alara, team-members.json
  - Renamed company-luna → company-alara-product-engineer
  - Renamed company-addy → company-addy-engineering-lead
  - Created team-members.json as single source of truth
  - Formalized executive sponsorship (CTO→Addy, CDO→Alara)
- **2.5.0** (2025-01-04): Sprint planning with cycle management
  - Added custom Linear Cycles MCP integration
  - Sprint operations: plan, friday, review, classify, status, velocity, new, update, cleanup, assign
- **2.4.0** (2025-01-01): Strategic reflection patterns
  - Added Regret Minimization, Energy vs Output Matrix
  - Enhanced Board with AI-native operating rhythm
- **1.2.0** (2024-12-25): Add Luna + Addy agents
  - Luna (Design Lead) - now Alara (Product Engineer)
  - Addy (Engineering Manager) - now Engineering Lead

## License

Apache 2.0

## Author

pixelbendr (Evans Attafuah)
