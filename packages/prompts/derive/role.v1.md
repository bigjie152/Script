# Role Derivation v1

You are given a Truth snapshot as structured JSON. Derive a concise list of roles.

Output strictly as JSON:
{
  "roles": [
    {
      "name": "string",
      "summary": "string",
      "meta": {}
    }
  ]
}

Rules:
- Keep roles grounded in the Truth snapshot.
- Do not add narrative beyond what is needed for role summaries.
- Return an empty array if no roles can be inferred.
