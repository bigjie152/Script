import { chromium } from "playwright";

const base = "https://script-426.pages.dev";
const username = "001";
const password = "123456";

const timeout = 60000;

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`;
}

async function fillFirst(page, selectors, value) {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    if (await loc.count()) {
      await loc.first().fill(value);
      return true;
    }
  }
  return false;
}

async function clickFirst(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector);
    if (await loc.count()) {
      await loc.first().click();
      return true;
    }
  }
  return false;
}

async function clickFirstEnabled(page, selectors) {
  for (const selector of selectors) {
    const loc = page.locator(selector).filter({ hasNot: page.locator('[disabled]') });
    if (await loc.count()) {
      await loc.first().click();
      return true;
    }
  }
  return false;
}

async function selectAiAction(page, value) {
  const select = page.getByTestId("ai-action-select");
  if (await select.count()) {
    await select.selectOption({ value });
    return true;
  }
  const fallback = page.locator("select").filter({
    has: page.locator(`option[value="${value}"]`)
  });
  if (await fallback.count()) {
    await fallback.first().selectOption({ value });
    return true;
  }
  const anySelect = page.locator("select");
  if (await anySelect.count()) {
    await anySelect.first().selectOption({ value });
    return true;
  }
  return false;
}

async function getCandidatePanel(page) {
  const header = page.getByText("AI 候选区（阅读与采纳）").first();
  if (await header.count()) {
    return header.locator("..").locator("..");
  }
  return page.locator("div", { hasText: "AI 候选区" }).first();
}

async function waitForCandidate(page) {
  await page.waitForTimeout(1000);
  const panel = await getCandidatePanel(page);
  const acceptBtn = panel.getByRole("button", { name: /采纳/ }).first();
  await acceptBtn.waitFor({ state: "visible", timeout: 180000 });
}

async function throwIfAiError(page) {
  const error = page.locator("text=AI 生成失败").first();
  if (await error.count()) {
    throw new Error("AI 生成失败");
  }
}

async function acceptFirstCandidate(page) {
  const panel = await getCandidatePanel(page);
  const insertBtn = panel.getByRole("button", { name: /采纳并插入/ });
  if (await insertBtn.count()) {
    await insertBtn.first().click();
    return true;
  }
  const buttons = panel.getByRole("button", { name: /采纳/ });
  if (await buttons.count()) {
    await buttons.first().click();
    return true;
  }
  return false;
}

async function assertProjectContent(page, base, projectId) {
  const cookies = await page.context().cookies();
  const cookieHeader =
    cookies.length > 0 ? cookies.map((c) => `${c.name}=${c.value}`).join("; ") : undefined;
  const fetchJson = async (path) => {
    const resp = await page.request.get(`${base}${path}`, {
      headers: cookieHeader ? { cookie: cookieHeader } : undefined
    });
    return resp.json();
  };
  const detail = await fetchJson(`/api/projects/${projectId}`);
  const story = await fetchJson(`/api/projects/${projectId}/modules/story`);
  const roles = await fetchJson(`/api/projects/${projectId}/modules/roles`);
  const clues = await fetchJson(`/api/projects/${projectId}/modules/clues`);
  const timeline = await fetchJson(`/api/projects/${projectId}/modules/timeline`);
  const dm = await fetchJson(`/api/projects/${projectId}/modules/dm`);

  const countDoc = (doc) => (Array.isArray(doc?.content) ? doc.content.length : 0);
  const countEntries = (doc) => (Array.isArray(doc?.entries) ? doc.entries.length : 0);

  const truthBlocks = countDoc(detail.truth?.content);
  const storyBlocks = countDoc(story.content);
  const rolesEntries = countEntries(roles.content);
  const cluesEntries = countEntries(clues.content);
  const timelineEntries = countEntries(timeline.content);
  const dmEntries = countEntries(dm.content);

  if (
    truthBlocks === 0 ||
    storyBlocks === 0 ||
    rolesEntries === 0 ||
    cluesEntries === 0 ||
    timelineEntries === 0 ||
    dmEntries === 0
  ) {
    throw new Error(
      `生成内容为空：truth=${truthBlocks}, story=${storyBlocks}, roles=${rolesEntries}, clues=${cluesEntries}, timeline=${timelineEntries}, dm=${dmEntries}`
    );
  }
}

async function waitForEnabled(locator, ms = 15000) {
  const start = Date.now();
  while (Date.now() - start < ms) {
    try {
      if (await locator.count()) {
        const enabled = await locator.first().isEnabled();
        if (enabled) return true;
      }
    } catch {}
    await new Promise((r) => setTimeout(r, 300));
  }
  return false;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  page.setDefaultTimeout(timeout);

  const projectName = `灵异推理本_反转_${nowStamp()}`;
  const truthText = "一句话真相：古宅怨灵其实是人为伪装，目的是掩盖当年失踪案与家族财产转移。";
  const overviewText = "本剧本聚焦古宅失踪案的真相与人心博弈，玩家将在多重反转中拼出完整事实。";
  const intentBase = "类型：灵异推理本；人数：4-5人；时长：约2小时；风格：反转多；请围绕古宅、失踪案、伪装成怨灵的真相展开，给出结构化内容。";

  try {
    await page.goto(`${base}/login`, { waitUntil: "domcontentloaded" });

    const filledUser = await fillFirst(page, [
      'input[name="username"]',
      'input[placeholder*="用户名"]',
      'input[placeholder*="账号"]',
      'form input[type="text"]',
      'form input'
    ], username);

    const filledPass = await fillFirst(page, [
      'input[name="password"]',
      'input[type="password"]',
      'form input[type="password"]',
      'form input'
    ], password);

    if (!filledUser || !filledPass) {
      throw new Error("无法定位登录输入框");
    }

    await clickFirst(page, [
      'button:has-text("登录")',
      'button:has-text("登 录")',
      'button[type="submit"]'
    ]);
    await page.waitForURL(/workspace|projects|editor/, { timeout: 10000 }).catch(() => {});
    await page.waitForTimeout(800);

    if (page.url().includes("/login")) {
      const apiResp = await page.request.post(`${base}/api/auth/login`, {
        data: { username, password }
      });
      if (!apiResp.ok()) {
        throw new Error(`API 登录失败：${apiResp.status()}`);
      }
      const setCookie = apiResp.headers()["set-cookie"] || "";
      const tokenMatch = setCookie.match(/([^=]+)=([^;]+);/);
      if (tokenMatch) {
        await page.context().addCookies([
          {
            name: tokenMatch[1],
            value: tokenMatch[2],
            domain: "script-426.pages.dev",
            path: "/"
          }
        ]);
      }
    }

    await page.goto(`${base}/workspace`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1200);

    const loggedOutBanner = page.locator('text=当前未登录');
    if (await loggedOutBanner.count()) {
      throw new Error("登录状态丢失，无法创建项目");
    }

    const createBtn = page.locator("header button").last();
    const ready = await waitForEnabled(createBtn, 15000);
    if (!ready) {
      throw new Error("新建项目按钮未启用");
    }
    await createBtn.click();

    await page.waitForURL(/projects\/.*\/editor/, { timeout });
    const projectUrl = page.url();
    const projectIdMatch = projectUrl.match(/projects\/([^/]+)/);
    const projectId = projectIdMatch ? projectIdMatch[1] : null;

    await clickFirst(page, ['text=概览', 'a:has-text("概览")']);
    await page.waitForTimeout(800);
    await fillFirst(page, ['input[placeholder="输入项目名称"]', 'input[placeholder*="项目名称"]'], projectName);
    await fillFirst(page, ['textarea[placeholder*="一句话介绍"]', 'textarea'], overviewText);
    const overviewEditor = page.locator('.tiptap');
    if (await overviewEditor.count()) {
      await overviewEditor.first().click();
      await page.keyboard.type(`剧本简介：${overviewText}`, { delay: 5 });
    }
    await page.waitForTimeout(500);

    await clickFirst(page, ['text=真相', 'a:has-text("真相")']);
    await page.waitForTimeout(800);

    const editor = page.locator('.tiptap');
    if (!(await editor.count())) {
      throw new Error("未找到编辑器区域");
    }
    await editor.first().click();
    await page.keyboard.type(truthText, { delay: 10 });

    await clickFirst(page, ['button[title="点击锁定"]', 'button:has-text("锁定")']);
    await page.waitForTimeout(1200);

    const steps = [
      { label: "真相", route: "truth", actionValue: "outline" },
      { label: "故事", route: "story", actionValue: "story" },
      { label: "角色", route: "roles", actionValue: "role" },
      { label: "线索", route: "clues", actionValue: "clue" },
      { label: "时间线", route: "timeline", actionValue: "timeline" },
      { label: "DM 手册", route: "dm", actionValue: "dm" }
    ];

    for (const step of steps) {
      await page.goto(`${base}/projects/${projectId}/editor/${step.route}`, {
        waitUntil: "domcontentloaded"
      });
      await page.waitForTimeout(800);
      const selected = await selectAiAction(page, step.actionValue);
      if (!selected) {
        throw new Error(`未找到 AI 动作选择框：${step.label}`);
      }
      const textarea = page.getByTestId("ai-intent-input");
      if (await textarea.count()) {
        await textarea.fill(intentBase);
      }
      await clickFirst(page, ['[data-testid="ai-generate-btn"]', 'button:has-text("生成候选")']);
      await page.locator("text=AI 候选区").scrollIntoViewIfNeeded();
      await throwIfAiError(page);
      await waitForCandidate(page);
      const accepted = await acceptFirstCandidate(page);
      if (!accepted) {
        throw new Error(`未找到可采纳的候选内容：${step.module}`);
      }
      await page.waitForTimeout(1200);
    }

    if (projectId) {
      await assertProjectContent(page, base, projectId);
    } else {
      throw new Error("无法解析项目 ID，无法校验内容");
    }

    console.log("Playwright flow completed:", projectName);
  } catch (err) {
    console.error("Playwright flow failed:", err);
    await page.screenshot({ path: "playwright-flow-error.png", fullPage: true });
  } finally {
    await browser.close();
  }
}

run();
