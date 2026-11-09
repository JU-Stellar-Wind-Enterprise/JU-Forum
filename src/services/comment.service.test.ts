import { beforeEach, describe, expect, it, vi } from "vitest";
import * as commentRepo from "@/repositories/comment.repository";
import * as postRepo from "@/repositories/post.repository";
import {
  canModerateComments,
  countVisibleComments,
  createComment,
  deleteComment,
  editComment,
  listPostComments,
  voteOnComment,
} from "./comment.service";

vi.mock("@/repositories/comment.repository", () => ({
  createComment: vi.fn(),
  findCommentById: vi.fn(),
  updateComment: vi.fn(),
  softDeleteComment: vi.fn(),
  listCommentsByPost: vi.fn(),
  isSubforumModerator: vi.fn(),
  findCommentVote: vi.fn(),
  createCommentVote: vi.fn(),
  updateCommentVote: vi.fn(),
  deleteCommentVote: vi.fn(),
}));

vi.mock("@/repositories/post.repository", () => ({
  findPostById: vi.fn(),
}));

const activePost = {
  id: "post-1",
  title: "Exam Schedule",
  content: "When do midterms start?",
  isLocked: false,
  isArchived: false,
  authorId: "user-author",
  subforumId: "sub-1",
  createdAt: new Date("2026-11-01T10:00:00Z"),
  updatedAt: new Date("2026-11-01T10:00:00Z"),
  author: { id: "user-author", name: "Alice" },
  subforum: { id: "sub-1", name: "CSE" },
};

const baseComment = {
  id: "comment-1",
  content: "Midterms start next Monday.",
  isDeleted: false,
  authorId: "user-1",
  postId: "post-1",
  parentId: null,
  createdAt: new Date("2026-11-01T11:00:00Z"),
  updatedAt: new Date("2026-11-01T11:00:00Z"),
};

describe("comment.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("createComment", () => {
    it("creates a top-level comment on an active post", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.createComment).mockResolvedValue({
        ...baseComment,
        id: "comment-101",
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "  Midterms start next Monday.  ",
      });

      expect(result).toEqual({ success: true, data: { id: "comment-101" } });
      expect(commentRepo.createComment).toHaveBeenCalledWith({
        postId: "post-1",
        authorId: "user-1",
        content: "Midterms start next Monday.",
        parentId: null,
      });
    });

    it("creates a nested reply under an existing active comment on the same post", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(commentRepo.createComment).mockResolvedValue({
        ...baseComment,
        id: "comment-102",
        parentId: "comment-1",
        content: "Thanks for confirming!",
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-2",
        content: "Thanks for confirming!",
        parentId: "comment-1",
      });

      expect(result).toEqual({ success: true, data: { id: "comment-102" } });
      expect(commentRepo.createComment).toHaveBeenCalledWith({
        postId: "post-1",
        authorId: "user-2",
        content: "Thanks for confirming!",
        parentId: "comment-1",
      });
    });

    it("accepts a comment of exactly 2,000 characters", async () => {
      const maxContent = "a".repeat(2000);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.createComment).mockResolvedValue({
        ...baseComment,
        id: "comment-max",
        content: maxContent,
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: maxContent,
      });

      expect(result).toEqual({ success: true, data: { id: "comment-max" } });
    });

    it("rejects an empty or whitespace-only comment", async () => {
      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "   \n\t  ",
      });

      expect(result).toEqual({ message: "Comment cannot be empty." });
      expect(postRepo.findPostById).not.toHaveBeenCalled();
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects a comment exceeding 2,000 characters", async () => {
      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "a".repeat(2001),
      });

      expect(result).toEqual({
        message: "Comment must be 2,000 characters or less.",
      });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects comment creation for suspended or inactive accounts", async () => {
      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Hello",
        authorStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Suspended accounts cannot participate in discussions.",
      });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects when the target post does not exist", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(null);

      const result = await createComment({
        postId: "missing-post",
        authorId: "user-1",
        content: "Hello",
      });

      expect(result).toEqual({ message: "Post not found." });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects commenting on a locked post", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        ...activePost,
        isLocked: true,
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Can I still comment?",
      });

      expect(result).toEqual({ message: "Comments are closed for this post." });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects commenting on an archived post", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        ...activePost,
        isArchived: true,
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Archived thread",
      });

      expect(result).toEqual({ message: "Comments are closed for this post." });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects reply when parent comment does not exist", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(null);

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Reply",
        parentId: "missing-parent",
      });

      expect(result).toEqual({ message: "Parent comment not found." });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects reply when parent comment belongs to a different post", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentById).mockResolvedValue({
        ...baseComment,
        postId: "post-999",
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Reply",
        parentId: "comment-1",
      });

      expect(result).toEqual({
        message: "Parent comment does not belong to this post.",
      });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("rejects reply to a soft-deleted comment", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentById).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Reply",
        parentId: "comment-1",
      });

      expect(result).toEqual({
        message: "Cannot reply to a deleted comment.",
      });
      expect(commentRepo.createComment).not.toHaveBeenCalled();
    });

    it("returns a friendly connectivity error when repository creation fails", async () => {
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.createComment).mockRejectedValue(
        new Error("Connection timeout"),
      );

      const result = await createComment({
        postId: "post-1",
        authorId: "user-1",
        content: "Valid comment",
      });

      expect(result).toEqual({
        message: "Unable to post comment. Please try again.",
      });
    });
  });

  describe("editComment", () => {
    it("allows the author to edit their own comment on an active post", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.updateComment).mockResolvedValue({
        ...baseComment,
        content: "Updated schedule details.",
      });

      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "  Updated schedule details.  ",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.updateComment).toHaveBeenCalledWith(
        "comment-1",
        "Updated schedule details.",
      );
    });

    it("rejects empty edited content", async () => {
      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "   ",
      });

      expect(result).toEqual({ message: "Comment cannot be empty." });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });

    it("rejects edited content exceeding 2,000 characters", async () => {
      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "a".repeat(2001),
      });

      expect(result).toEqual({
        message: "Comment must be 2,000 characters or less.",
      });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });

    it("rejects editing a missing or soft-deleted comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "Edited text",
      });

      expect(result).toEqual({ message: "Comment not found." });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });

    it("rejects editing another user's comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);

      const result = await editComment({
        commentId: "comment-1",
        userId: "other-user",
        content: "Hacked edit",
      });

      expect(result).toEqual({
        message: "You can only edit your own comments.",
      });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });

    it("rejects editing a comment on a locked or archived post", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        ...activePost,
        isLocked: true,
      });

      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "Edited text",
      });

      expect(result).toEqual({ message: "Comments are closed for this post." });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });

    it("rejects editing by a suspended user", async () => {
      const result = await editComment({
        commentId: "comment-1",
        userId: "user-1",
        content: "Edited text",
        userStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Suspended accounts cannot participate in discussions.",
      });
      expect(commentRepo.updateComment).not.toHaveBeenCalled();
    });
  });

  describe("deleteComment", () => {
    it("allows the author to soft-delete their own comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(commentRepo.softDeleteComment).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await deleteComment({
        commentId: "comment-1",
        userId: "user-1",
        userRole: "STUDENT",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.softDeleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("allows a global MODERATOR to remove another user's comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(commentRepo.softDeleteComment).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await deleteComment({
        commentId: "comment-1",
        userId: "mod-1",
        userRole: "MODERATOR",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.softDeleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("allows an ADMIN or SYSTEM_ADMIN to remove another user's comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(commentRepo.softDeleteComment).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await deleteComment({
        commentId: "comment-1",
        userId: "admin-1",
        userRole: "ADMIN",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.softDeleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("allows an assigned subforum moderator or owner to remove another user's comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.isSubforumModerator).mockResolvedValue(true);
      vi.mocked(commentRepo.softDeleteComment).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await deleteComment({
        commentId: "comment-1",
        userId: "sub-mod-1",
        userRole: "STUDENT",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.isSubforumModerator).toHaveBeenCalledWith(
        "sub-mod-1",
        "sub-1",
      );
      expect(commentRepo.softDeleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("rejects deletion by an unauthorized user", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.isSubforumModerator).mockResolvedValue(false);

      const result = await deleteComment({
        commentId: "comment-1",
        userId: "other-student",
        userRole: "STUDENT",
      });

      expect(result).toEqual({
        message: "You do not have permission to delete this comment.",
      });
      expect(commentRepo.softDeleteComment).not.toHaveBeenCalled();
    });

    it("rejects deleting a missing or already deleted comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(null);

      const result = await deleteComment({
        commentId: "missing",
        userId: "user-1",
        userRole: "STUDENT",
      });

      expect(result).toEqual({ message: "Comment not found." });
      expect(commentRepo.softDeleteComment).not.toHaveBeenCalled();
    });
  });

  describe("voteOnComment", () => {
    it("creates a new upvote on an active comment (including own comment)", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentVote).mockResolvedValue(null);

      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-1",
        type: "UPVOTE",
        userStatus: "ACTIVE",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.createCommentVote).toHaveBeenCalledWith(
        "user-1",
        "comment-1",
        "UPVOTE",
      );
    });

    it("removes an existing vote when clicking the same vote type again", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentVote).mockResolvedValue({
        userId: "user-2",
        commentId: "comment-1",
        type: "UPVOTE",
      });

      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-2",
        type: "UPVOTE",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.deleteCommentVote).toHaveBeenCalledWith(
        "user-2",
        "comment-1",
      );
    });

    it("switches vote when clicking the opposite vote type", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue(activePost);
      vi.mocked(commentRepo.findCommentVote).mockResolvedValue({
        userId: "user-2",
        commentId: "comment-1",
        type: "UPVOTE",
      });

      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-2",
        type: "DOWNVOTE",
      });

      expect(result).toEqual({ success: true });
      expect(commentRepo.updateCommentVote).toHaveBeenCalledWith(
        "user-2",
        "comment-1",
        "DOWNVOTE",
      );
    });

    it("rejects voting by a suspended account", async () => {
      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-2",
        type: "UPVOTE",
        userStatus: "SUSPENDED",
      });

      expect(result).toEqual({
        message: "Suspended accounts cannot participate in voting.",
      });
      expect(commentRepo.createCommentVote).not.toHaveBeenCalled();
    });

    it("rejects voting on a deleted or missing comment", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue({
        ...baseComment,
        isDeleted: true,
      });

      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-2",
        type: "UPVOTE",
      });

      expect(result).toEqual({ message: "Comment not found." });
      expect(commentRepo.createCommentVote).not.toHaveBeenCalled();
    });

    it("rejects voting on a comment under a locked or archived post", async () => {
      vi.mocked(commentRepo.findCommentById).mockResolvedValue(baseComment);
      vi.mocked(postRepo.findPostById).mockResolvedValue({
        ...activePost,
        isArchived: true,
      });

      const result = await voteOnComment({
        commentId: "comment-1",
        userId: "user-2",
        type: "UPVOTE",
      });

      expect(result).toEqual({
        message: "Voting is disabled on locked or archived content.",
      });
      expect(commentRepo.createCommentVote).not.toHaveBeenCalled();
    });
  });

  describe("listPostComments", () => {
    it("builds a nested comment tree with vote totals and role badges", async () => {
      const created = new Date("2026-11-01T10:00:00Z");
      const edited = new Date("2026-11-01T10:05:00Z");
      vi.mocked(commentRepo.listCommentsByPost).mockResolvedValue([
        {
          id: "c1",
          content: "Top comment",
          isDeleted: false,
          authorId: "u1",
          postId: "post-1",
          parentId: null,
          createdAt: created,
          updatedAt: created,
          author: { id: "u1", name: "Alice", role: "FACULTY" },
          votes: [
            { userId: "viewer-1", type: "UPVOTE" },
            { userId: "u2", type: "UPVOTE" },
            { userId: "u3", type: "DOWNVOTE" },
          ],
        },
        {
          id: "c2",
          content: "First reply",
          isDeleted: false,
          authorId: "u2",
          postId: "post-1",
          parentId: "c1",
          createdAt: created,
          updatedAt: edited,
          author: { id: "u2", name: "Bob", role: "STUDENT" },
          votes: [],
        },
        {
          id: "c3",
          content: "Nested reply",
          isDeleted: false,
          authorId: "u3",
          postId: "post-1",
          parentId: "c2",
          createdAt: created,
          updatedAt: created,
          author: { id: "u3", name: "Carol", role: "MODERATOR" },
          votes: [{ userId: "viewer-1", type: "DOWNVOTE" }],
        },
      ]);

      const tree = await listPostComments("post-1", "viewer-1");

      expect(tree).toHaveLength(1);
      expect(tree[0]).toMatchObject({
        id: "c1",
        content: "Top comment",
        isEdited: false,
        upvotes: 2,
        downvotes: 1,
        score: 1,
        currentVote: "UPVOTE",
        author: { id: "u1", name: "Alice", role: "FACULTY" },
      });
      expect(tree[0].replies).toHaveLength(1);
      expect(tree[0].replies[0]).toMatchObject({
        id: "c2",
        isEdited: true,
        score: 0,
        currentVote: null,
      });
      expect(tree[0].replies[0].replies).toHaveLength(1);
      expect(tree[0].replies[0].replies[0]).toMatchObject({
        id: "c3",
        upvotes: 0,
        downvotes: 1,
        score: -1,
        currentVote: "DOWNVOTE",
      });
      expect(countVisibleComments(tree)).toBe(3);
    });

    it("hides soft-deleted comments without replies and keeps [deleted] placeholder when replies exist", async () => {
      const now = new Date("2026-11-01T10:00:00Z");
      vi.mocked(commentRepo.listCommentsByPost).mockResolvedValue([
        {
          id: "leaf-deleted",
          content: "Secret bad text",
          isDeleted: true,
          authorId: "u1",
          postId: "post-1",
          parentId: null,
          createdAt: now,
          updatedAt: now,
          author: { id: "u1", name: "Alice", role: "STUDENT" },
          votes: [{ userId: "u2", type: "UPVOTE" }],
        },
        {
          id: "parent-deleted",
          content: "Removed parent text",
          isDeleted: true,
          authorId: "u1",
          postId: "post-1",
          parentId: null,
          createdAt: now,
          updatedAt: now,
          author: { id: "u1", name: "Alice", role: "STUDENT" },
          votes: [{ userId: "u2", type: "UPVOTE" }],
        },
        {
          id: "active-reply",
          content: "Reply stays visible",
          isDeleted: false,
          authorId: "u2",
          postId: "post-1",
          parentId: "parent-deleted",
          createdAt: now,
          updatedAt: now,
          author: { id: "u2", name: "Bob", role: "STUDENT" },
          votes: [],
        },
        {
          id: "parent-deleted-all-children-deleted",
          content: "Parent also gone",
          isDeleted: true,
          authorId: "u1",
          postId: "post-1",
          parentId: null,
          createdAt: now,
          updatedAt: now,
          author: { id: "u1", name: "Alice", role: "STUDENT" },
          votes: [],
        },
        {
          id: "child-deleted",
          content: "Child gone too",
          isDeleted: true,
          authorId: "u2",
          postId: "post-1",
          parentId: "parent-deleted-all-children-deleted",
          createdAt: now,
          updatedAt: now,
          author: { id: "u2", name: "Bob", role: "STUDENT" },
          votes: [],
        },
      ]);

      const tree = await listPostComments("post-1", "u2");

      expect(tree).toHaveLength(1);
      expect(tree[0]).toMatchObject({
        id: "parent-deleted",
        content: "[deleted]",
        isDeleted: true,
        author: null,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        currentVote: null,
      });
      expect(tree[0].replies).toHaveLength(1);
      expect(tree[0].replies[0].id).toBe("active-reply");
      expect(countVisibleComments(tree)).toBe(1);
    });
  });

  describe("canModerateComments", () => {
    it("returns true for global moderator and admin roles without querying subforum moderators", async () => {
      expect(await canModerateComments("u1", "MODERATOR", "sub-1")).toBe(true);
      expect(await canModerateComments("u1", "ADMIN", "sub-1")).toBe(true);
      expect(await canModerateComments("u1", "SYSTEM_ADMIN", "sub-1")).toBe(
        true,
      );
      expect(commentRepo.isSubforumModerator).not.toHaveBeenCalled();
    });

    it("checks subforum moderator status for standard roles", async () => {
      vi.mocked(commentRepo.isSubforumModerator).mockResolvedValueOnce(true);
      expect(await canModerateComments("u2", "STUDENT", "sub-1")).toBe(true);

      vi.mocked(commentRepo.isSubforumModerator).mockResolvedValueOnce(false);
      expect(await canModerateComments("u3", "STUDENT", "sub-1")).toBe(false);
    });
  });
});
