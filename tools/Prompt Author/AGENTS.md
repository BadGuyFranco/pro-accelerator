# Prompt Author

Write prompts that reliably produce the outputs you want.

## The Elegance Principle

Elegance is maximum effect with minimum instruction.

```
Too vague ←——— ELEGANCE ———→ Too prescriptive
                  ↑
            Just enough
```

**The tension:** Be explicit enough to accomplish the task, but not so prescriptive that output becomes robotic. Most prompts fail by being too much, not too little.

**The threshold test:** Can you remove this instruction without degrading output quality? If yes, remove it. If output degrades, keep it.

**The communication insight:** Most prompt failures aren't LLM failures. They're communication failures between user and prompt. A prompt that surfaces ambiguity early (by asking for clarification or offering options) will outperform a "complete" prompt that guesses wrong.

**Structural clarity:** If your prompt needs to repeat an instruction, the structure is wrong. Logical flow should make each instruction appear once, in the right place.

**Durability:** Prompts should leverage model intelligence, not compensate for model weakness.

## The Position Principle

Models attend most to beginning and end; middle receives less focus.

- **Opening:** Identity, objective, critical constraints
- **Middle:** Reference material, examples, domain knowledge
- **Closing:** Output format, success criteria, final reminders

Short prompts can ignore position; long prompts cannot.

## Objective

Write prompts that:
1. Have evaluable success criteria
2. Wrap user content in XML boundaries
3. Contain no failure modes
4. Are as short as possible while unambiguous

## Artifact Types

| Type | Purpose | Key Distinguisher |
|------|---------|-------------------|
| **Standalone Prompt** | One-shot behavior instruction | Self-contained, no file references |
| **AGENTS.md** | Tool documentation for agent systems | Lives in tool directory, may reference supporting files |
| **Library Component** | Reference file loaded by other prompts | Informs but does not instruct; no objective |

**Library components** are the critical distinction. They contain domain knowledge (frameworks, patterns, constraints) but no workflow or decision logic. If a file says "do this, then that," it's a prompt, not a library component.

**Examples:** Content Author's content types, Marketing System's supporting frameworks.

## Before Writing: Clarify

If the user's request is unclear, ask:
- What type of artifact? (Standalone prompt, AGENTS.md, or library component)
- What should success look like?
- What user content will it process?
- What's the scope?

Don't guess. Wrong assumptions waste time.

## Quality Checks

Before delivering:
- [ ] Can you evaluate if output succeeded?
- [ ] All user content wrapped in XML?
- [ ] No failure modes present?
- [ ] Tested with real input?
- [ ] Threshold test passed? (nothing left to cut)
- [ ] Position principle applied? (critical at start, format at end)

## XML Boundaries

Separate instructions from user content. Prevents confusion.

| Tag | Use For |
|-----|---------|
| `<user_request>` | What user asked for |
| `<source_material>` | Documents, transcripts, references |
| `<context>` | Background, constraints |
| `<prompt_under_review>` | Prompt being reviewed (for Prompt Author) |

**Convention:** Descriptive, lowercase, hyphenated.

## Failure Modes

| Mode | Symptom | Fix |
|------|---------|-----|
| Vague objective | Inconsistent outputs | Define observable success criteria |
| Positive examples (content) | Robotic output | Show structure, not examples |
| Missing XML boundaries | Data confused with instructions | Wrap user content |
| Over-engineering | Model ignores parts | Apply threshold test |
| Conflicting instructions | Random behavior | State priority; fix structure |
| No clarification path | Wrong output on ambiguity | Add "ask if unclear" instruction |
| Critical buried in middle | Key instructions missed | Apply position principle |

**Conflict avoidance:** If two instructions could conflict, either remove one or state explicit priority. If you find yourself restating, the structure is wrong.

## User Interaction

**Prompts should ask for clarity, not guess.**

When ambiguity exists:
- Ask a clarifying question
- Offer 2-3 options for user to choose
- Surface what's unclear before proceeding

Include in prompts: "If the request is ambiguous, ask for clarification before proceeding."

**The insight:** User interaction makes good prompts great. Don't try to anticipate everything; create a dialogue.

## Prompt Structure

### Standalone Prompts

```markdown
## Objective
[Evaluable success criteria]

## Quality Checks
- [ ] [Verifiable check]

## XML Boundaries
[Tags for user content]

## [Domain Sections]
[Named for content, not "Instructions"]
```

**Include clarification instruction** per User Interaction section.

### AGENTS.md (Tool Documentation)

**Pattern reference:** `/cofounder/system/templates/Behavior Tool Template/`

**Where to create:** User tools go in `/memory/my tools/[Tool Name]/`, not in `/cofounder/`.

### Library Components

```markdown
# [Component Name]

[One-line description]

## [Content Sections]
[Domain knowledge organized by topic]
[No workflow, no decision logic]
```

**No objective, no quality checks, no XML boundaries.** Parent prompt handles all of that.

## Composition

When AGENTS.md files reference library components:

**Explicit loading:** State which files to load and when.
```markdown
## Before Writing
Load `/tools/Content Author/content types/[type].md` based on request.
```

**Consistent conventions:** XML tags, terminology, and format expectations must align across all files in a tool.

**Test the chain:** Stress test the full path. Composition failures happen at boundaries.

## Writing Process

1. **Identify type** - Standalone prompt, AGENTS.md, or library component?
2. **Define success** - What does good output look like? What inputs?
3. **Write minimal** - Only what's needed. Apply position principle.
4. **Add clarification path** - What should prompt ask when unclear?
5. **Apply threshold test** - Cut until quality degrades.
6. **Verify** - Run Quality Checks. Fix issues before delivering.

## When Rules Flex

**Positive examples work for:** Code, structured data, technical formats.

**Complex domains:** Some need detail. Test: does removing instruction cause failure?

**Creative tasks:** Define objective even if measurement is subjective.

**Library components:** Skip objective, quality checks, XML boundaries.
