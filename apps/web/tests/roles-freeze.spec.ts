import { test, expect, request as playwrightRequest } from "@playwright/test";

type ProjectCreateResponse = {
  projectId?: string;
  project?: { id?: string };
};

function buildCollection(entries: Array<{ id: string; name: string }>) {
  return {
    kind: "collection",
    entries: entries.map((entry) => ({
      id: entry.id,
      name: entry.name,
      content: {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "" }] }]
      },
      meta: {},
      data: {},
      updatedAt: null
    })),
    activeId: entries[0]?.id ?? null
  };
}

test("roles switch remains responsive", async ({ browser }) => {
  const baseURL = process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000";
  const api = await playwrightRequest.newContext({ baseURL });

  const username = `e2e_${Date.now()}`;
  const password = "Passw0rd!";

  const register = await api.post("/api/auth/register", {
    data: { username, password }
  });

  if (!register.ok() && register.status() !== 409) {
    throw new Error(`register failed: ${register.status()}`);
  }

  const login = await api.post("/api/auth/login", {
    data: { username, password }
  });
  expect(login.ok()).toBeTruthy();

  const projectRes = await api.post("/api/projects", {
    data: { name: "角色卡死回归", description: "playwright" }
  });
  expect(projectRes.status()).toBe(201);
  const projectJson = (await projectRes.json()) as ProjectCreateResponse;
  const projectId = projectJson.projectId || projectJson.project?.id;
  expect(projectId).toBeTruthy();

  const roleAId = crypto.randomUUID();
  const roleBId = crypto.randomUUID();
  const roleContent = buildCollection([
    { id: roleAId, name: "角色A" },
    { id: roleBId, name: "角色B" }
  ]);

  const rolesPut = await api.put(`/api/projects/${projectId}/modules/roles`, {
    data: { content: roleContent }
  });
  expect(rolesPut.ok()).toBeTruthy();

  const storageState = await api.storageState();
  const context = await browser.newContext({ storageState, baseURL });
  const page = await context.newPage();

  await page.goto(`/projects/${projectId}/editor/roles?entry=${roleAId}`);
  const roleAButton = page.getByRole("button", { name: "角色A" });
  const roleBButton = page.getByRole("button", { name: "角色B" });
  await expect(roleAButton).toBeVisible();
  await expect(roleBButton).toBeVisible();

  const editor = page.locator(".ProseMirror").first();
  await expect(editor).toBeVisible();

  for (let i = 0; i < 10; i += 1) {
    await roleBButton.click();
    await editor.click();
    await page.keyboard.type(`测试B${i}`);

    await roleAButton.click();
    await editor.click();
    await page.keyboard.type(`测试A${i}`);
  }

  await api.dispose();
  await context.close();
});
