# CFO Financial Frameworks Knowledge Base

## Kevan Parekh - Apple CFO 2025

### Background
- **Education**: BS Electrical Engineering (University of Michigan) + MBA (University of Chicago Booth)
- **Career**: Thomson Reuters → General Motors → Apple (2013) → CFO (Jan 2025)
- **Scope**: Accounting, business support, FP&A, treasury, investor relations, internal audit, tax

### Leadership Philosophy
- **Data-Driven Decisions**: Complex data → actionable strategies
- **Precision Engineering**: Enable innovation with financial foresight
- **Continuity**: Build on proven financial playbook
- **Educate the Market**: Help stakeholders understand the business

> "Sharp intellect, wise judgment, and financial brilliance" - Tim Cook

---

## Capital Allocation Metrics

### Net Present Value (NPV)

**Formula**: Sum of discounted future cash flows

**When to Use**: Primary decision anchor, accounts for time value of money

**Interpretation**:
- NPV > 0: Project creates value
- NPV < 0: Project destroys value
- Higher NPV = better investment

### Internal Rate of Return (IRR)

**Formula**: Rate where NPV = 0

**When to Use**: Compare against WACC, cross-project comparison

**Interpretation**:
- IRR > WACC: Project creates value
- IRR < WACC: Project destroys value
- Compare IRRs across projects of similar risk

### Return on Investment (ROI)

**Formula**: (Gain - Cost) / Cost × 100

**When to Use**: Quick wins, simple comparisons

**Interpretation**:
- ROI > 0%: Profitable
- Compare against company hurdle rate
- Simple but ignores time value

### Payback Period

**Formula**: Time to recover initial investment

**When to Use**: Liquidity concerns, risk assessment

**Interpretation**:
- Shorter = less risk
- Ignores cash flows after payback
- Use alongside NPV, not instead of

---

## Decision Playbook

1. **Use NPV as anchor** - Direct measure of value creation
2. **Check IRR vs WACC** - Quick comparisons across projects
3. **Look at Payback** - If liquidity is tight
4. **Account for execution risk** - None of these metrics capture project slip

### Risk Buffers

| Project Type | Buffer Multiplier |
|--------------|-------------------|
| Simple, well-understood | 1.5x |
| Moderate complexity | 2.0x |
| Novel, high uncertainty | 2.5x+ |

---

## RICE Scoring Framework

For feature/project prioritization:

| Factor | Scale | Definition |
|--------|-------|------------|
| **Reach** | # users/quarter | How many users will this impact? |
| **Impact** | 0.25, 0.5, 1, 2, 3 | How much will it impact each user? |
| **Confidence** | 50%, 80%, 100% | How confident are we in estimates? |
| **Effort** | Person-weeks | How much work is required? |

**Formula**: RICE Score = (Reach × Impact × Confidence) / Effort

### Impact Scale

| Score | Meaning |
|-------|---------|
| 3 | Massive impact |
| 2 | High impact |
| 1 | Medium impact |
| 0.5 | Low impact |
| 0.25 | Minimal impact |

---

## Cost Models

### Engineering Cost

```
Loaded Cost = Base Salary × 1.4 (benefits + overhead)
Project Cost = Loaded Cost × Developers × Weeks × Buffer
```

### Infrastructure Cost

```
Monthly = Compute + Storage + Network + Services
Annual = Monthly × 12 × Growth Factor (1.2-1.5)
```

### Opportunity Cost

```
Opportunity Cost = Best Alternative Value - Chosen Option Value
```

---

## Financial Analysis Checklist

### Before Approving Investment

- [ ] What are the key assumptions driving projections?
- [ ] What's the confidence level on revenue estimates?
- [ ] What's the cost of delay vs. cost of being wrong?
- [ ] Are there hidden costs (maintenance, support, tech debt)?
- [ ] What's the opportunity cost?
- [ ] Is data sufficient for reliable analysis?
- [ ] Have we applied appropriate risk buffers?
- [ ] What's the exit strategy if projections are wrong?

### Red Flags

- Optimistic-only projections
- No sensitivity analysis
- Ignoring maintenance costs
- Underestimating integration effort
- No defined success metrics
