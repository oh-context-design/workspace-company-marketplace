---
name: interview-me
description: >
  Structured technical interview to clarify requirements through Socratic questioning. Asks one question at a time until requirements are unambiguous.
user-invocable: false
allowed-tools: AskUserQuestion
metadata:
  capabilities: requirements clarification, Socratic questioning, ambiguity resolution, one-at-a-time questioning
---

**Purpose:** When a request is ambiguous and `idea-refine` alone isn't enough, conduct a structured interview. Ask one question at a time (never batch). Stop when requirements are unambiguous.

**Rules:**
1. One question per turn — never ask multiple questions at once
2. Listen to answers before forming the next question
3. Build on previous answers (don't reset)
4. Stop when you could write a complete spec without guessing
5. Summarize at the end: "Here's what I understand..."

**Interview sequence (adapt based on domain):**
1. Start with the problem: "What's the core problem you're trying to solve?"
2. Probe the user: "Who experiences this?"
3. Probe success: "What does 'done' look like to you?"
4. Probe constraints: "What's the hardest constraint we can't work around?"
5. Probe scope: "What would you cut if we had half the time?"
6. Probe existing art: "Does anything similar already exist we could extend?"

**Red flags:**
- Answering a question with another question (clarify first)
- Jumping to solutions before understanding the problem
- Assuming technical choices before constraints are known

**Output:** A structured requirements summary. Feed into `spec-driven-development`.
