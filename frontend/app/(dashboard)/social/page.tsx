"use client";

import { useCallback, useEffect, useState } from "react";
import { api, SocialPost } from "@/lib/api";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/store/auth";
import { formatDisplayDateTime } from "@/lib/dateFormat";
import { MessageSquare, Heart, Send, Trash2, RefreshCw } from "lucide-react";

export default function SocialWallPage() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [content, setContent] = useState("");
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [err, setErr] = useState("");

  const loadPosts = useCallback(async () => {
    setErr("");
    try {
      const res = await api.social.listPosts({ page: "1", per_page: "50" });
      setPosts(res.items);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed to load social wall");
    }
  }, []);

  useEffect(() => {
    loadPosts();
  }, [loadPosts]);

  const createPost = async () => {
    if (!content.trim()) return;
    try {
      setLoading(true);
      await api.social.createPost({ content: content.trim() });
      setContent("");
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async (postId: number) => {
    try {
      await api.social.toggleLike(postId);
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const addComment = async (postId: number) => {
    const value = (commentInputs[postId] || "").trim();
    if (!value) return;
    try {
      await api.social.addComment(postId, { content: value });
      setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const deletePost = async (postId: number) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.social.deletePost(postId);
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  const deleteComment = async (commentId: number) => {
    if (!confirm("Delete this comment?")) return;
    try {
      await api.social.deleteComment(commentId);
      await loadPosts();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-800">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white">
            <MessageSquare className="h-5 w-5" />
          </div>
          Social Wall
        </h1>
        <Button variant="outline" className="rounded-xl" onClick={loadPosts}>
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      <Card className="border-0 shadow-lg shadow-slate-200/50">
        <CardContent className="space-y-3 pt-6">
          <p className="text-sm text-slate-600">
            Share updates, appreciate teammates, and stay connected across the organization.
          </p>
          <textarea
            className="min-h-[96px] w-full rounded-xl border border-slate-200 bg-white p-3 text-sm outline-none transition focus:border-indigo-400"
            placeholder="What's happening at work today?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
          />
          <div className="flex justify-end">
            <Button className="rounded-xl bg-indigo-600 text-white hover:bg-indigo-700" onClick={createPost} disabled={loading}>
              <Send className="mr-2 h-4 w-4" />
              Post update
            </Button>
          </div>
        </CardContent>
      </Card>

      {err && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-3 text-sm text-red-800">{err}</CardContent>
        </Card>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.id} className="border-0 shadow-lg shadow-slate-200/50">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-800">{post.employee_name}</p>
                  <p className="text-xs text-slate-500">{formatDisplayDateTime(post.created_at)}</p>
                </div>
                {post.can_delete && (
                  <Button size="sm" variant="outline" className="rounded-lg text-red-600 hover:bg-red-50" onClick={() => deletePost(post.id)}>
                    <Trash2 className="mr-1 h-4 w-4" />
                    Delete
                  </Button>
                )}
              </div>

              <p className="whitespace-pre-wrap text-sm text-slate-700">{post.content}</p>

              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className={`rounded-lg ${post.is_liked_by_me ? "border-pink-300 bg-pink-50 text-pink-700" : ""}`}
                  onClick={() => toggleLike(post.id)}
                >
                  <Heart className="mr-1 h-4 w-4" />
                  {post.is_liked_by_me ? "Liked" : "Like"} ({post.like_count})
                </Button>
                <span className="text-xs text-slate-500">{post.comment_count} comments</span>
              </div>

              <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                {post.comments.map((c) => (
                  <div key={c.id} className="rounded-lg border border-slate-100 bg-white px-3 py-2">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-700">{c.employee_name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[11px] text-slate-500">{formatDisplayDateTime(c.created_at)}</p>
                        {c.can_delete && (
                          <button className="text-[11px] text-red-600 hover:underline" onClick={() => deleteComment(c.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700">{c.content}</p>
                  </div>
                ))}

                <div className="flex gap-2">
                  <Input
                    placeholder="Write a comment..."
                    value={commentInputs[post.id] || ""}
                    onChange={(e) => setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))}
                  />
                  <Button size="sm" className="rounded-lg" onClick={() => addComment(post.id)}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {posts.length === 0 && (
        <Card className="border-0 shadow-lg shadow-slate-200/50">
          <CardContent className="py-8 text-center text-sm text-slate-500">
            No posts yet. Be the first to share something with your team, {user?.name || "employee"}.
          </CardContent>
        </Card>
      )}
    </div>
  );
}
