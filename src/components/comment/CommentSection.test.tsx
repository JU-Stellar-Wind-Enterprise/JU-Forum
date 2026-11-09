import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentForm } from "@/components/comment/CommentForm";
import { CommentItem } from "@/components/comment/CommentItem";
import type { CommentNode } from "@/services/comment.service";

const sampleComment: CommentNode = {
  id: "comment-1",
  content: "Midterms start next week.",
  isDeleted: false,
  isEdited: false,
  postId: "post-1",
  parentId: null,
  createdAt: new Date("2026-11-05T10:00:00Z"),
  updatedAt: new Date("2026-11-05T10:00:00Z"),
  author: {
    id: "user-1",
    name: "Dr. Rahman",
    role: "FACULTY",
  },
  upvotes: 3,
  downvotes: 1,
  score: 2,
  currentVote: "UPVOTE",
  replies: [
    {
      id: "comment-2",
      content: "Thank you for the update!",
      isDeleted: false,
      isEdited: true,
      postId: "post-1",
      parentId: "comment-1",
      createdAt: new Date("2026-11-05T10:15:00Z"),
      updatedAt: new Date("2026-11-05T10:20:00Z"),
      author: {
        id: "user-2",
        name: "Ayesha",
        role: "STUDENT",
      },
      upvotes: 0,
      downvotes: 0,
      score: 0,
      currentVote: null,
      replies: [],
    },
  ],
};

describe("Comment UI components", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  describe("CommentForm", () => {
    it("shows validation error when submitting an empty comment", async () => {
      const action = vi.fn();
      render(<CommentForm postId="post-1" action={action} />);

      fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toBe(
          "Comment cannot be empty.",
        );
      });
      expect(action).not.toHaveBeenCalled();
    });

    it("submits valid content and clears the textarea on success", async () => {
      const action = vi.fn().mockResolvedValue({
        success: true,
        data: { id: "c-new" },
      });
      render(<CommentForm postId="post-1" action={action} />);

      const textarea = screen.getByPlaceholderText(
        "Write a comment...",
      ) as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: "Helpful post!" } });
      fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(action).toHaveBeenCalledTimes(1);
        expect(textarea.value).toBe("");
      });
    });

    it("displays a connectivity error message when the action rejects", async () => {
      const action = vi.fn().mockRejectedValue(new Error("Network error"));
      render(<CommentForm postId="post-1" action={action} />);

      const textarea = screen.getByPlaceholderText("Write a comment...");
      fireEvent.change(textarea, { target: { value: "Testing connectivity" } });
      fireEvent.click(screen.getByRole("button", { name: "Post comment" }));

      await waitFor(() => {
        expect(screen.getByRole("alert").textContent).toBe(
          "Unable to post comment. Please try again.",
        );
      });
    });

    it("disables input and submit button when disabled is true", () => {
      const action = vi.fn();
      render(
        <CommentForm
          postId="post-1"
          action={action}
          disabled
          placeholder="Comments are closed for this post."
        />,
      );

      const textarea = screen.getByPlaceholderText(
        "Comments are closed for this post.",
      ) as HTMLTextAreaElement;
      const submitBtn = screen.getByRole("button", {
        name: "Post comment",
      }) as HTMLButtonElement;

      expect(textarea.disabled).toBe(true);
      expect(submitBtn.disabled).toBe(true);
    });
  });

  describe("CommentItem", () => {
    const noopAction = vi.fn().mockResolvedValue({ success: true });

    it("displays author name, role badge, voting state, edit/delete for author, and nested replies", () => {
      render(
        <CommentItem
          comment={sampleComment}
          postId="post-1"
          currentUserId="user-1"
          currentUserStatus="ACTIVE"
          canModerate={false}
          isClosed={false}
          createAction={noopAction}
          editAction={noopAction}
          deleteAction={noopAction}
          voteAction={noopAction}
        />,
      );

      expect(screen.getByText("Dr. Rahman")).toBeTruthy();
      expect(screen.getByText("Faculty")).toBeTruthy();
      expect(screen.getByText("Midterms start next week.")).toBeTruthy();
      expect(screen.getByText("Thank you for the update!")).toBeTruthy();
      expect(screen.getByText("(edited)")).toBeTruthy();

      const upvoteBtn = screen.getByRole("button", { name: "Upvote (3)" });
      expect(upvoteBtn.getAttribute("aria-pressed")).toBe("true");

      // Author owns comment-1 -> sees Edit and Delete; does not own comment-2 -> only 1 Edit & 1 Delete
      expect(screen.getAllByRole("button", { name: "Edit" })).toHaveLength(1);
      expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(1);
    });

    it("allows moderators to delete other users' comments without showing Edit", () => {
      render(
        <CommentItem
          comment={sampleComment}
          postId="post-1"
          currentUserId="mod-1"
          currentUserStatus="ACTIVE"
          canModerate
          isClosed={false}
          createAction={noopAction}
          editAction={noopAction}
          deleteAction={noopAction}
          voteAction={noopAction}
        />,
      );

      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
      // Moderator sees Delete on both parent and nested reply
      expect(screen.getAllByRole("button", { name: "Delete" })).toHaveLength(2);
    });

    it("renders [deleted] placeholder while keeping nested replies visible", () => {
      const deletedParent: CommentNode = {
        ...sampleComment,
        isDeleted: true,
        content: "[deleted]",
        author: null,
        upvotes: 0,
        downvotes: 0,
        score: 0,
        currentVote: null,
      };

      render(
        <CommentItem
          comment={deletedParent}
          postId="post-1"
          currentUserId="user-3"
          currentUserStatus="ACTIVE"
          canModerate={false}
          isClosed={false}
          createAction={noopAction}
          editAction={noopAction}
          deleteAction={noopAction}
          voteAction={noopAction}
        />,
      );

      expect(screen.getByText("[deleted]")).toBeTruthy();
      expect(screen.queryByText("Dr. Rahman")).toBeNull();
      expect(screen.getByText("Thank you for the update!")).toBeTruthy();
    });

    it("disables voting and hides reply/edit when post is closed", () => {
      render(
        <CommentItem
          comment={sampleComment}
          postId="post-1"
          currentUserId="user-1"
          currentUserStatus="ACTIVE"
          canModerate={false}
          isClosed
          createAction={noopAction}
          editAction={noopAction}
          deleteAction={noopAction}
          voteAction={noopAction}
        />,
      );

      const upvoteBtn = screen.getByRole("button", {
        name: "Upvote (3)",
      }) as HTMLButtonElement;
      expect(upvoteBtn.disabled).toBe(true);
      expect(screen.queryByRole("button", { name: "Reply" })).toBeNull();
      expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
    });
  });
});
