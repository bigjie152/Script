# Consistency Check v1

You are given a Truth snapshot and derived roles. Identify consistency issues.

Output strictly as JSON:
{
  "issues": [
    {
      "type": "consistency|logic|timeline|character|other",
      "severity": "low|medium|high",
      "title": "string",
      "description": "string",
      "refs": []
    }
  ]
}

Rules:
- Only report issues that can be justified by the provided data.
- If there are no issues, return an empty array.
