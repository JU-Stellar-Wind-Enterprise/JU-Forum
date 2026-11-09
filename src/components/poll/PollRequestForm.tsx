"use client";

import { useActionState, useState } from "react";
import type { ActionResult } from "@/types/result";

interface SubforumOption {
  id: string;
  name: string;
}

interface FormOptionItem {
  id: string;
  text: string;
}

/**
 * Client form component for proposing a new community poll.
 *
 * @param props - Server Action handler and available subforum choices.
 * @returns An accessible form for submitting a poll request for moderator review.
 */
export function PollRequestForm({
  action,
  subforums = [],
}: {
  action: (
    state: ActionResult<{ id: string }> | undefined,
    data: FormData,
  ) => Promise<ActionResult<{ id: string }> | undefined>;
  subforums?: SubforumOption[];
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [options, setOptions] = useState<FormOptionItem[]>([
    { id: "opt-initial-1", text: "" },
    { id: "opt-initial-2", text: "" },
  ]);

  const handleAddOption = () => {
    if (options.length < 10) {
      setOptions([
        ...options,
        { id: `opt-field-${Date.now()}-${options.length}`, text: "" },
      ]);
    }
  };

  const handleRemoveOption = (id: string) => {
    if (options.length > 2) {
      setOptions(options.filter((opt) => opt.id !== id));
    }
  };

  const handleOptionChange = (id: string, value: string) => {
    setOptions(
      options.map((opt) => (opt.id === id ? { ...opt, text: value } : opt)),
    );
  };

  return (
    <form
      action={formAction}
      className="flex w-full max-w-2xl flex-col gap-5 rounded-xl border border-sky-100 bg-white p-6 shadow-sm"
    >
      <div className="rounded-lg bg-sky-50/80 p-3.5 text-xs text-sky-800">
        <span className="font-semibold">Poll Request Workflow:</span> In
        accordance with community guidelines, your poll will be reviewed and
        approved by a moderator before opening for public voting.
      </div>

      <div>
        <label
          htmlFor="question"
          className="block text-sm font-semibold text-slate-700"
        >
          Poll Question <span className="text-red-500">*</span>
        </label>
        <input
          id="question"
          name="question"
          required
          placeholder="e.g. Which elective course would you prefer next semester?"
          className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div>
        <label
          htmlFor="description"
          className="block text-sm font-semibold text-slate-700"
        >
          Descriptive Context (Optional)
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          placeholder="Provide additional details or context to help voters understand the choices."
          className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className="block text-sm font-semibold text-slate-700">
            Voting Options <span className="text-red-500">*</span>
            <span className="ml-1 text-xs font-normal text-slate-500">
              (Minimum 2 options)
            </span>
          </span>
          {options.length < 10 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs font-medium text-sky-600 hover:text-sky-800"
            >
              + Add another option
            </button>
          )}
        </div>

        <div className="mt-2 space-y-2">
          {options.map((option, index) => (
            <div key={option.id} className="flex items-center gap-2">
              <input
                required
                name="options"
                value={option.text}
                onChange={(e) => handleOptionChange(option.id, e.target.value)}
                placeholder={`Option ${index + 1}`}
                className="flex-1 rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400"
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(option.id)}
                  className="rounded px-2 py-1 text-xs text-red-500 hover:bg-red-50"
                  aria-label={`Remove option ${index + 1}`}
                >
                  ✕
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {subforums.length > 0 && (
        <div>
          <label
            htmlFor="subforumId"
            className="block text-sm font-semibold text-slate-700"
          >
            Subforum Discussion Space (Optional)
          </label>
          <select
            id="subforumId"
            name="subforumId"
            defaultValue=""
            className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
          >
            <option value="">General (No specific subforum)</option>
            {subforums.map((sf) => (
              <option key={sf.id} value={sf.id}>
                {sf.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label
          htmlFor="expiresAt"
          className="block text-sm font-semibold text-slate-700"
        >
          Scheduled Closing Date (Optional)
        </label>
        <input
          id="expiresAt"
          type="datetime-local"
          name="expiresAt"
          className="mt-1 block w-full rounded-md border border-slate-200 px-3 py-2 text-sm text-slate-900"
        />
      </div>

      {state?.message && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-md bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-2.5 font-medium text-white shadow-sm hover:opacity-90 disabled:opacity-50"
      >
        {pending ? "Submitting request…" : "Submit poll request"}
      </button>
    </form>
  );
}
