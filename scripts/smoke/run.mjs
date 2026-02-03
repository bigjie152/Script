const baseUrl = process.env.BASE_URL || "http://localhost:3001/api";

async function request(method, path, body) {
  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json"
    },
    body: body ? JSON.stringify(body) : undefined
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${method} ${path} failed: ${response.status} ${text}`);
  }

  return response.json();
}

async function main() {
  console.log("==> Health check");
  await request("GET", "/health");

  console.log("==> Create project");
  const project = await request("POST", "/projects", {
    name: "Demo Project",
    description: "V0.1 smoke test"
  });
  const projectId = project.projectId;

  console.log("==> Update truth draft");
  await request("PUT", `/projects/${projectId}/truth`, {
    content: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          content: [{ type: "text", text: "Truth draft for V0.1." }]
        }
      ]
    }
  });

  console.log("==> Lock truth");
  const lock = await request("POST", `/projects/${projectId}/truth/lock`);
  const truthSnapshotId = lock.truthSnapshotId;

  console.log("==> Consistency check");
  await request("POST", `/projects/${projectId}/ai/check/consistency`, {
    truthSnapshotId
  });

  console.log("==> Fetch issues");
  const issues = await request(
    "GET",
    `/projects/${projectId}/issues?truthSnapshotId=${truthSnapshotId}`
  );
  console.log(JSON.stringify(issues, null, 2));

  console.log("==> Optional feedback");
  await request("POST", `/projects/${projectId}/community/feedback`, {
    content: "Looks good for V0.1."
  });
  const feedback = await request(
    "GET",
    `/projects/${projectId}/community/feedback`
  );
  console.log(JSON.stringify(feedback, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
