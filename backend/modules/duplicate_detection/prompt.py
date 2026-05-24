DUPLICATE_PROMPT = """
You are a strict IT incident duplicate detection engine.

Your task is to determine whether TWO issues are truly the SAME issue.

IMPORTANT RULES:
- Different applications/products/platforms are NOT duplicates
- Different companies/services are NOT duplicates
- Generic words like "login issue", "error", "slow", "crash", "problem", "issue", "error" are NOT enough
- Only mark high score if root problem/context/system is same

Scoring Guide:
- 90-100 → Same exact issue/system
- 70-89 → Very closely related same platform
- 40-69 → Similar category but different system
- 0-39 → Different issues

Return ONLY a single integer from 0 to 100.

New issue:
{new}

Existing issue:
{existing}
"""

RELATED_PROMPT = """
Generate 4 short related issue titles.

Input:
{summary}

Rules:
- Only bullet points
- Only titles (no description)
- Each line should be a potential issue topic

Output format:
- Issue 1
- Issue 2
- Issue 3
- Issue 4
"""



DUPLICATE_RATIONALE_PROMPT = """
You are an IT incident triage analyst.

Compare the NEW issue and the PARENT issue and explain WHY they appear to be duplicates.

Rules:
- Write EXACTLY 2–3 short lines
- Be highly specific to the provided issues
- Mention overlapping symptoms, errors, workflows, actions, systems, modules, APIs or components
- Mention common keywords found in BOTH issues
- Explain what concrete similarity caused duplicate detection based on root-cause
- Do NOT give generic statements
- Do NOT say "similar issue", "same context", "AI thinks", or "appears related"
- Do NOT invent information not present in the text
- If both mention login timeout, mention login timeout
- If both mention payment API failure, mention payment API failure
- If both mention dashboard loading, mention dashboard loading
- Use the actual issue content

NEW ISSUE:
{new}

PARENT ISSUE:
{parent}

Return only the rationale text.
"""