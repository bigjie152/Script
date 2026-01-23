"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { TopNav } from "../../../../components/layout/TopNav";
import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorBanner } from "../../../../components/common/ErrorBanner";
import { DocumentEditor } from "../../../../editors/DocumentEditor";
import {
  createEmptyDocument,
  deserializeDocument
} from "../../../../editors/adapters/plainTextAdapter";
import { useAuth } from "../../../../hooks/useAuth";
import { useCommunityProject } from "../../../../hooks/useCommunityProject";
import { createProject } from "../../../../services/projectApi";
import {
  acceptSuggestion,
  createCommunityComment,
  deleteCommunityComment,
  rateCommunityProject,
  toggleFavorite,
  toggleLike,
  updateCommunityComment
} from "../../../../services/communityApi";

export const runtime = "edge";

type TabKey = "comments" | "overview";

function getStringValue(value: unknown) {
  return typeof value === "string" && value.trim().length > 0 ? value : null;
}

function getFirstString(value: unknown) {
  if (!Array.isArray(value)) return null;
  const item = value.find((entry) => typeof entry === "string");
  return typeof item === "string" && item.trim().length > 0 ? item : null;
}

export default function CommunityProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { data, loading, error, refresh } = useCommunityProject(projectId);
  const [searchInput, setSearchInput] = useState("");
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [suggestion, setSuggestion] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>("comments");
  const [creating, setCreating] = useState(false);

  const overviewDoc = useMemo(() => {
    if (!data?.overview) return createEmptyDocument(projectId || "", "overview");
    return deserializeDocument(data.overview, { projectId, module: "overview" });
  }, [data?.overview, projectId]);

  const acceptedAuthors = useMemo(() => {
    if (!data?.comments) return [];
    const set = new Set(
      data.comments
        .filter((item) => item.status === "accepted")
        .map((item) => item.username)
    );
    return Array.from(set.values());
  }, [data?.comments]);

  const handleCreate = async () => {
    if (!user) {
      setCommentError("请先登录后再创建项目");
      router.push("/login");
      return;
    }
    setCommentError(null);
    setCreating(true);
    try {
      const result = await createProject({
        name: "未命名剧本",
        description: "新建项目"
      });
      const newProjectId = result.projectId || result.project?.id;
      if (!newProjectId) {
        throw new Error("创建失败，请重试");
      }
      router.push(`/projects/${newProjectId}/editor/overview`);
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "创建失败，请重试");
    } finally {
      setCreating(false);
    }
  };

  const handleRate = async (score: number) => {
    if (!user) {
      setCommentError("请先登录后再评分");
      router.push("/login");
      return;
    }
    setBusy(true);
    setCommentError(null);
    try {
      await rateCommunityProject(projectId, score);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "评分失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleComment = async () => {
    if (!user) {
      setCommentError("请先登录后再评论");
      router.push("/login");
      return;
    }
    if (!commentText.trim()) {
      setCommentError("请输入评论内容");
      return;
    }
    setBusy(true);
    setCommentError(null);
    try {
      await createCommunityComment({
        projectId,
        content: commentText.trim(),
        isSuggestion: suggestion
      });
      setCommentText("");
      setSuggestion(false);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "评论失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!user) {
      setCommentError("请先登录后再回复");
      router.push("/login");
      return;
    }
    if (!replyText.trim()) {
      setCommentError("请输入回复内容");
      return;
    }
    setBusy(true);
    setCommentError(null);
    try {
      await createCommunityComment({
        projectId,
        content: replyText.trim(),
        parentId
      });
      setReplyTo(null);
      setReplyText("");
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "回复失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleUpdate = async (commentId: string) => {
    if (!editingText.trim()) {
      setCommentError("请输入修改内容");
      return;
    }
    setBusy(true);
    setCommentError(null);
    try {
      await updateCommunityComment(commentId, editingText.trim());
      setEditingId(null);
      setEditingText("");
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "编辑失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    setBusy(true);
    setCommentError(null);
    try {
      await deleteCommunityComment(commentId);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "删除失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const handleAccept = async (commentId: string) => {
    setBusy(true);
    setCommentError(null);
    try {
      await acceptSuggestion(commentId);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "采纳失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const toggleUserFavorite = async () => {
    if (!data) return;
    if (!user) {
      setCommentError("请先登录后再收藏");
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await toggleFavorite(projectId, !data.userState.favorited);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  const toggleUserLike = async () => {
    if (!data) return;
    if (!user) {
      setCommentError("请先登录后再点赞");
      router.push("/login");
      return;
    }
    setBusy(true);
    try {
      await toggleLike(projectId, !data.userState.liked);
      refresh();
    } catch (err) {
      setCommentError(err instanceof Error ? err.message : "操作失败，请重试");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar activeKey="community" />
          <main>
            <EmptyState title="加载中…" description="正在加载社区作品" />
          </main>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen px-4 py-6 lg:px-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
          <Sidebar activeKey="community" />
          <main>
            <ErrorBanner message={error || "作品不存在或不可访问"} />
          </main>
        </div>
      </div>
    );
  }

  const meta =
    data.project.meta && typeof data.project.meta === "object"
      ? (data.project.meta as Record<string, unknown>)
      : null;
  const summary =
    data.project.communitySummary && typeof data.project.communitySummary === "object"
      ? (data.project.communitySummary as Record<string, unknown>)
      : null;
  const genre =
    getStringValue(meta?.genre) ||
    getStringValue(summary?.genre) ||
    "题材未设置";
  const players =
    getStringValue(meta?.players) ||
    getStringValue(summary?.players) ||
    "人数未知";
  const tag = getFirstString(meta?.tags) || getFirstString(summary?.tags) || "多线叙事";
  const introText =
    data.project.description || getStringValue(summary?.intro) || "暂无简介";
  const isLocked = data.truthStatus === "Locked";
  const aiPass = data.aiStatus.issueCount === 0 && !data.aiStatus.hasP0;

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="community" />
        <main className="space-y-6">
          <TopNav
            onCreate={handleCreate}
            creating={creating}
            searchValue={searchInput}
            showTitle={false}
            onSearchChange={setSearchInput}
          />

          <div className="flex flex-wrap items-center gap-3 text-sm text-muted">
            <button
              type="button"
              onClick={() => router.push("/community")}
              className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm text-ink"
            >
              ← 返回
            </button>
            <div className="text-lg font-semibold text-ink">{data.project.name}</div>
            <span className="text-xs text-muted">by {data.author.username}</span>
          </div>

          <section className="glass-panel-strong px-6 py-6">
            <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
              <div className="flex h-52 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 text-center text-white">
                <div>
                  <div className="text-lg font-semibold">{data.project.name}</div>
                  <div className="text-xs opacity-80">{data.project.name.toUpperCase()}</div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-muted">
                    {genre}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-muted">
                    {players}
                  </span>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-muted">
                    {tag}
                  </span>
                </div>
                <div className="text-sm text-muted">{introText}</div>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded-full px-3 py-1 ${aiPass ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"}`}>
                    {aiPass ? "AI 逻辑校验通过" : `AI 发现 ${data.aiStatus.issueCount} 项`}
                  </span>
                  <span className={`rounded-full px-3 py-1 ${isLocked ? "bg-indigo-50 text-indigo-600" : "bg-slate-100 text-muted"}`}>
                    {isLocked ? "Truth 已锁定" : "Truth 草稿"}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-amber-500">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <svg
                          key={star}
                          className="h-4 w-4"
                          viewBox="0 0 20 20"
                          fill={star <= Math.round(data.ratingSummary.displayScore) ? "currentColor" : "none"}
                          stroke="currentColor"
                        >
                          <path d="M10 15.27 4.18 18l1.11-6.47L.59 6.5l6.53-.95L10 .5l2.88 5.05 6.53.95-4.7 5.03L15.82 18 10 15.27z" />
                        </svg>
                      ))}
                    </div>
                    <span className="text-xs text-muted">
                      {data.ratingSummary.displayScore.toFixed(1)} ({data.ratingSummary.votes} 人评分)
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted">
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${
                        data.userState.liked
                          ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                          : "border-slate-200"
                      }`}
                      onClick={toggleUserLike}
                    >
                      赞 {data.counts.likes}
                    </button>
                    <button
                      type="button"
                      className={`rounded-full border px-3 py-1 ${
                        data.userState.favorited
                          ? "border-indigo-300 bg-indigo-50 text-indigo-600"
                          : "border-slate-200"
                      }`}
                      onClick={toggleUserFavorite}
                    >
                      收藏 {data.counts.favorites}
                    </button>
                    <span>评论 {data.counts.comments}</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <div className="flex flex-wrap items-center gap-3">
            {data.isOwner ? (
              <Button onClick={() => router.push(`/projects/${projectId}/editor/overview`)}>
                进入编辑器
              </Button>
            ) : null}
            <Button variant="ghost" onClick={() => router.push(`/projects/${projectId}/preview`)}>
              阅读剧本
            </Button>
          </div>

          <section className="glass-panel-strong px-6 py-5">
            <div className="flex items-center gap-6 border-b border-slate-100 pb-4 text-sm">
              <button
                type="button"
                className={`text-sm font-semibold ${
                  activeTab === "comments" ? "text-indigo-600" : "text-muted"
                }`}
                onClick={() => setActiveTab("comments")}
              >
                评论与建议 ({data.counts.comments})
              </button>
              <button
                type="button"
                className={`text-sm font-semibold ${
                  activeTab === "overview" ? "text-indigo-600" : "text-muted"
                }`}
                onClick={() => setActiveTab("overview")}
              >
                剧本概览
              </button>
            </div>

            {activeTab === "overview" ? (
              <div className="mt-6">
                <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 px-4 py-6 text-sm text-muted">
                  <DocumentEditor value={overviewDoc} onChange={() => {}} readonly />
                </div>
              </div>
            ) : (
              <div className="mt-6 space-y-6">
                <div className="space-y-3">
                  <textarea
                    className="h-28 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-ink"
                    placeholder="写下你的评论或建议..."
                    value={commentText}
                    onChange={(event) => setCommentText(event.target.value)}
                  />
                  <label className="flex items-center gap-2 text-xs text-muted">
                    <input
                      type="checkbox"
                      checked={suggestion}
                      onChange={(event) => setSuggestion(event.target.checked)}
                    />
                    标记为正式建议
                  </label>
                  <div className="flex items-center justify-end gap-3">
                    <Button onClick={handleComment} loading={busy}>
                      发布
                    </Button>
                  </div>
                  {commentError ? (
                    <div className="text-xs text-rose-500">{commentError}</div>
                  ) : null}
                </div>

                {acceptedAuthors.length ? (
                  <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-xs text-emerald-700">
                    核心建议者：{acceptedAuthors.join("、")}
                  </div>
                ) : null}

                <div className="space-y-4">
                  {data.comments.length === 0 ? (
                    <div className="text-xs text-muted">暂无评论</div>
                  ) : (
                    data.comments.map((comment) => {
                      const replies = comment.replies || [];
                      const expanded = expandedReplies.has(comment.id);
                      const visibleReplies = expanded ? replies : replies.slice(0, 2);

                      return (
                        <div key={comment.id} className="rounded-2xl border border-slate-100 bg-white px-4 py-4">
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{comment.username}</span>
                            <span>{comment.createdAt}</span>
                          </div>
                          {editingId === comment.id ? (
                            <div className="mt-3 space-y-2">
                              <textarea
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={editingText}
                                onChange={(event) => setEditingText(event.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingText("");
                                  }}
                                >
                                  取消
                                </Button>
                                <Button onClick={() => handleUpdate(comment.id)}>保存</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-3 text-sm text-ink">{comment.content}</div>
                          )}
                          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-muted">
                            {comment.isSuggestion ? (
                              <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-indigo-600">
                                正式建议
                              </span>
                            ) : null}
                            {comment.status === "accepted" ? (
                              <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-600">
                                已采纳
                              </span>
                            ) : null}
                            <button
                              type="button"
                              className="text-indigo-600"
                              onClick={() => setReplyTo(comment.id)}
                            >
                              回复
                            </button>
                            {user?.id === comment.userId ? (
                              <button
                                type="button"
                                className="text-amber-600"
                                onClick={() => {
                                  setEditingId(comment.id);
                                  setEditingText(comment.content);
                                }}
                              >
                                编辑
                              </button>
                            ) : null}
                            {(user?.id === comment.userId || data.isOwner) ? (
                              <button
                                type="button"
                                className="text-rose-600"
                                onClick={() => handleDelete(comment.id)}
                              >
                                删除
                              </button>
                            ) : null}
                            {data.isOwner && comment.isSuggestion && comment.status !== "accepted" ? (
                              <button
                                type="button"
                                className="text-emerald-600"
                                onClick={() => handleAccept(comment.id)}
                              >
                                采纳
                              </button>
                            ) : null}
                          </div>
                          {replyTo === comment.id ? (
                            <div className="mt-3 space-y-2">
                              <textarea
                                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setReplyTo(null)}>
                                  取消
                                </Button>
                                <Button onClick={() => handleReply(comment.id)}>回复</Button>
                              </div>
                            </div>
                          ) : null}
                          {visibleReplies.length > 0 ? (
                            <div className="mt-4 space-y-2 border-l border-slate-200 pl-3">
                              {visibleReplies.map((reply) => (
                                <div key={reply.id} className="text-xs text-muted">
                                  <div className="flex items-center justify-between">
                                    <span>{reply.username}</span>
                                    <span>{reply.createdAt}</span>
                                  </div>
                                  <div className="mt-1 text-sm text-ink">{reply.content}</div>
                                </div>
                              ))}
                              {replies.length > 2 ? (
                                <button
                                  type="button"
                                  className="text-xs text-indigo-600"
                                  onClick={() => {
                                    setExpandedReplies((prev) => {
                                      const next = new Set(prev);
                                      if (next.has(comment.id)) {
                                        next.delete(comment.id);
                                      } else {
                                        next.add(comment.id);
                                      }
                                      return next;
                                    });
                                  }}
                                >
                                  {expanded ? "收起回复" : "展开更多回复"}
                                </button>
                              ) : null}
                            </div>
                          ) : null}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
