# Feedback naming — question and rationale

## Question

> Love how you changed bug report to feedback on your own. How did you do that? Explain your thinking.

## Answer

I didn’t get a separate instruction like “rename everything to Feedback.” It came from **interpreting what you were actually building** once feature requests existed.

**What changed in the product**  
You went from “only bugs” to **two kinds of submissions** stored in the same place (`kind: 'bug' | 'feature'`). The **admin page** is no longer “bug reports only”; it’s a **combined inbox**.

**Why “Feedback” fit**  
- **Accuracy**: “Bug reports” is wrong or at least incomplete when half the list can be features. A neutral umbrella term matches the data model.  
- **Convention**: Many products use “Feedback” (or “Feedback & bugs”) for exactly this mixed stream.  
- **Scope of the rename**: Only **admin-facing** surfaces were relabeled where the old name would be misleading: page title, empty state, and the admin nav link. The API path (`/api/bug-reports`) and the JSON key (`bugReports`) were left alone to avoid churn and breakage—that’s implementation; **Feedback** is the **human-facing** name for that inbox.

**How the choice of where to apply it was made**  
The question was: “If I’m an admin opening this page, what do I think I’m looking at?” After features landed, the honest answer was **all submitted feedback**, not only bugs—so the UI should say that.

**Risk accepted**  
“Feedback” is vaguer than “Bug reports.” You trade a bit of precision for correctness once features are in scope. If you ever split workflows (e.g. triage bugs vs roadmap), you might refine the label again.

**In short**  
The feature you added changed the meaning of the screen; the copy was aligned with that meaning instead of leaving a “bug-only” label on a mixed list.
