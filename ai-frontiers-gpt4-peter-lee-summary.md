# AI Frontiers: GPT-4 and the Future of Research — Summary

**Episode:** Ashley Llorens in conversation with Peter Lee (Head of Microsoft Research)  
**Context:** March 2023, shortly after OpenAI announced GPT-4

---

## Overview

A conversation between Ashley Llorens (Microsoft Research) and Peter Lee on GPT-4 as a phase change in AI, “research in context,” healthcare applications, risks and trust, regulation, and the future of computing research.

---

## Research in Context

- **Idea:** Work backward from *inevitable futures*—what will definitely be true about the world (1–30 years out)—and derive research priorities from that.
- **Past example:** Cancer largely solved in 10 years; aging demographics → rise of age-related neurological disease → implications for where medical research should focus.
- **Current shift:** Very general AI at or beyond human intelligence looks inevitable, possibly in &lt;5–10 years. That’s more disruptive than prior “inevitable future” examples.
- **Historical pattern:** Lee has seen this kind of transition before (e.g., 3D graphics → NVIDIA, GPUs; compilers, wireless, hypertext, OS). Research triumphs become everyday infrastructure; the original research area moves out of academia. **We are in that transition now for large language models.**

---

## Why LLMs Feel Different

- Earlier technologies (GPUs, pinch-to-zoom, etc.) “blend into the background”; we don’t think of them as such.
- LLMs feel more **in the foreground**. We’re wired to anthropomorphize; even when we know they’re not sentient, we can’t fully override that response—analogous to optical illusions and perception.
- For **research labs and careers**, the disruption may be similar to prior tech waves; for **users**, the experience is qualitatively different.

---

## GPT-4 and Healthcare

### Why Healthcare Has Been Hard

- **Overoptimism** from both tech and medicine: tech thinks it can solve imaging, diagnosis, billing, etc.; medicine is impressed by AI/ML/cloud. Integration into real workflow and safety is much harder than it looks.
- **Causal vs. correlational:** Medicine relies on cause–effect; ML is good at correlation. Confounding factors matter (e.g., smoking and cancer).
- **Fluid environments:** Diagnosis and therapy happen in messy, confounded settings.

### What’s Different with GPT-4

- **Causal-style reasoning:** In a demo (AP biology–style questions), GPT-4 not only chose answers but *explained* them using “because” and cause–effect chains. That kind of explicit reasoning was unexpected in an LLM and addresses a historical blocker for medical AI.
- **Administrative load:** Strong at forms, prior authorization, paperwork—back-office tasks that don’t touch life-or-death decisions but reduce burden. That aligns with deployable, lower-risk use cases.

### Risks and Trust

- **Hallucination vs. creativity:** The same tendency to “make things up” is related to useful speculation and educated guessing—central to medicine. We’re now using AI on questions *without* known answers; the risk is whether we can trust the answers.
- **Limitations:** e.g., odd errors in basic statistics (e.g., forgetting to square a term); sometimes defensiveness when corrected (“you made the mistake”). Improvements have reduced but not eliminated this.
- **Mitigation:** Using a **second instance** of GPT-4 to review the first’s output helps catch errors (by the model or by the human); the second instance is less attached to the original answer.
- **Broader “responsible AI”:** Beyond correctness and harmful outputs: regulation, job displacement, digital divides, access. “Responsible AI” may be too narrow; “societal AI” or similar framing is needed.

---

## Regulation and the “Brain in a Box”

- **FDA and SaMD:** Existing frameworks for software-as-medical-device and ML-based devices don’t map onto GPT-4. Validating it is like validating “a doctor’s brain in a box”—no clear framework.
- **Lee’s view:** For now, **rules of engagement should apply to humans, not to the machine.** The medical community should own guidelines (what’s appropriate use by doctors, nurses, admins, etc.) and enforce them (e.g., via licensing/certification). Regulators shouldn’t overreact before we have better frameworks.
- **Future:** Research on how to clinically validate “brain in a box” could eventually support new device categories (e.g., “AI MD”) and inform regulation. For the moment, emphasis is on human responsibility and professional norms.
- **Caveat:** “Brain in a box” is intentionally overdramatic; the system isn’t a human brain (no episodic memory, not actively learning). It’s also fundamentally different from narrow ML systems (e.g., fixed model weights, single-right-answer tasks). It’s stochastic, with self-attention in constant evolution—so validation and assurance are a distinct challenge.

---

## What’s Next for Computing Research (Microsoft Research)

Five major AI threads:

1. **AI and society** — Societal impact, responsible/societal AI.
2. **Physics of AGI** — Theoretical, mathematically oriented work on capabilities, limits, and trend lines of LLMs (e.g., Sébastien Bubeck’s work); fewer hard theorems, more physics-like modeling.
3. **Copilot / costar** — How AI amplifies daily work; interaction modes and applications.
4. **AI4Science** — Using large AI systems for discovery in physics, astronomy, chemistry, biology.
5. **Model innovation** — New architectures (e.g., Kosmos for multimodal, VALL-E for voice replication).

- MSR is both **contributing to** the research that enables OpenAI-style systems and **part of** Microsoft’s push to make this infrastructure of everyday life.
- Over the next decade, research on LLMs specifically may fade as they industrialize, while new research vistas open. Other areas (cybersecurity, privacy, physical sciences, etc.) remain central.

---

## Credits and Tone

- Thanks to Sam Altman and OpenAI for early access and latitude to explore implications in health, education, and other critical domains.
- Call for informed public discussion and careful consideration rather than rushed regulatory reaction.

---

*Summary of the AI Frontiers podcast episode with Ashley Llorens and Peter Lee (March 2023).*
