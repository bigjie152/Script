"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Sidebar } from "../../../../components/layout/Sidebar";
import { Button } from "../../../../components/common/Button";
import { EmptyState } from "../../../../components/common/EmptyState";
import { ErrorBanner } from "../../../../components/common/ErrorBanner";
import { DocumentEditor } from "../../../../editors/DocumentEditor";
import { createEmptyDocument, deserializeDocument } from "../../../../editors/adapters/plainTextAdapter";
import { useAuth } from "../../../../hooks/useAuth";
import { useCommunityProject } from "../../../../hooks/useCommunityProject";
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

export default function CommunityProjectDetailPage() {
  const router = useRouter();
  const params = useParams();
  const projectId = typeof params?.id === "string" ? params.id : "";
  const { user } = useAuth();
  const { data, loading, error, refresh } = useCommunityProject(projectId);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [suggestion, setSuggestion] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

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

  return (
    <div className="min-h-screen px-4 py-6 lg:px-8">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <Sidebar activeKey="community" />
        <main className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-2xl font-semibold">{data.project.name}</div>
              <div className="mt-1 text-sm text-muted">
                作者：{data.author.username}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {data.isOwner ? (
                <Button onClick={() => router.push(`/projects/${projectId}/editor/overview`)}>
                  进入编辑器
                </Button>
              ) : null}
              <Button variant="ghost" onClick={() => router.push("/community")}>
                返回广场
              </Button>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_300px]">
            <section className="space-y-4">
              <div className="glass-panel-strong px-6 py-5">
                <div className="text-sm text-muted">作品简介</div>
                <div className="mt-2 text-sm text-ink">
                  {data.project.description || "暂无简介"}
                </div>
                <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted">
                  <div>更新时间：{data.project.updatedAt || "-"}</div>
                  <div>真相状态：{data.truthStatus === "Locked" ? "已锁定" : "草稿"}</div>
                  <div>AI 校验：{data.aiStatus.issueCount} 项问题</div>
                </div>
              </div>

              <div className="glass-panel-strong px-6 py-5">
                <div className="text-sm font-semibold">评分与互动</div>
                <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                  <div className="text-lg font-semibold text-ink">
                    {data.ratingSummary.displayScore.toFixed(1)}
                  </div>
                  <div className="text-xs text-muted">
                    {data.ratingSummary.votes} 人评分，均分 {data.ratingSummary.average.toFixed(1)}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      disabled={busy}
                      onClick={() => handleRate(score)}
                      className={`rounded-full border px-3 py-1 text-xs ${
                        data.userState.rating === score
                          ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                          : "border-slate-200 text-muted"
                      }`}
                    >
                      {score} 星
                    </button>
                  ))}
                </div>
                <div className="mt-4 flex flex-wrap gap-3 text-xs text-muted">
                  <button
                    type="button"
                    onClick={toggleUserLike}
                    className={`rounded-full border px-3 py-1 ${
                      data.userState.liked
                        ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-slate-200"
                    }`}
                  >
                    👍 点赞 {data.counts.likes}
                  </button>
                  <button
                    type="button"
                    onClick={toggleUserFavorite}
                    className={`rounded-full border px-3 py-1 ${
                      data.userState.favorited
                        ? "border-indigo-400 bg-indigo-50 text-indigo-600"
                        : "border-slate-200"
                    }`}
                  >
                    ⭐ 收藏 {data.counts.favorites}
                  </button>
                </div>
              </div>

              {acceptedAuthors.length ? (
                <div className="glass-panel-strong px-6 py-4 text-sm text-muted">
                  核心建议者：
                  <span className="ml-2 text-ink">
                    {acceptedAuthors.join("、")}
                  </span>
                </div>
              ) : null}

              <div className="glass-panel-strong px-6 py-5">
                <div className="text-sm font-semibold">作品概览</div>
                <div className="mt-4">
                  <DocumentEditor value={overviewDoc} onChange={() => {}} readonly />
                </div>
              </div>
            </section>

            <aside className="space-y-4">
              <div className="glass-panel-strong px-5 py-4">
                <div className="text-sm font-semibold">评论与建议</div>
                <div className="mt-3 space-y-2">
                  <textarea
                    className="h-24 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-ink"
                    placeholder="分享你的看法或建议..."
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
                  <Button onClick={handleComment} loading={busy} className="w-full">
                    发布评论
                  </Button>
                  {commentError ? (
                    <div className="text-xs text-rose-500">{commentError}</div>
                  ) : null}
                </div>
              </div>
              <div className="glass-panel-strong px-5 py-4">
                <div className="text-sm font-semibold">评论列表</div>
                <div className="mt-4 space-y-4 text-sm">
                  {data.comments.length === 0 ? (
                    <div className="text-xs text-muted">暂无评论</div>
                  ) : (
                    data.comments.map((comment) => {
                      const replies = comment.replies || [];
                      const expanded = expandedReplies.has(comment.id);
                      const visibleReplies = expanded ? replies : replies.slice(0, 2);

                      return (
                        <div key={comment.id} className="rounded-xl border border-slate-100 bg-white px-3 py-3">
                          <div className="flex items-center justify-between text-xs text-muted">
                            <span>{comment.username}</span>
                            <span>{comment.createdAt}</span>
                          </div>
                          {editingId === comment.id ? (
                            <div className="mt-2 space-y-2">
                              <textarea
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
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
                                <Button onClick={() => handleUpdate(comment.id)}>
                                  保存
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2 text-sm text-ink">{comment.content}</div>
                          )}
                          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
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
                            {data.isOwner &&
                            comment.isSuggestion &&
                            comment.status !== "accepted" ? (
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
                                className="w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
                                value={replyText}
                                onChange={(event) => setReplyText(event.target.value)}
                              />
                              <div className="flex gap-2">
                                <Button variant="ghost" onClick={() => setReplyTo(null)}>
                                  取消
                                </Button>
                                <Button onClick={() => handleReply(comment.id)}>
                                  回复
                                </Button>
                              </div>
                            </div>
                          ) : null}
                          {visibleReplies.length > 0 ? (
                            <div className="mt-3 space-y-2 border-l border-slate-200 pl-3">
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
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
