<style>
@import url("https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;600&family=Noto+Serif:ital,wght@0,400;0,700;1,400&family=Poppins:wght@500;600&display=swap");
.course-page {
  --nu-purple-160: #1d0235;
  --nu-purple-150: #260841;
  --nu-purple-140: #30104e;
  --nu-purple-130: #38175a;
  --nu-purple-120: #401f68;
  --nu-purple-100: #4e2a84;
  --nu-purple-50: #9380b6;
  --nu-purple-30: #b6acd1;
  --nu-purple-10: #e4e0ee;
  --nu-black-80: #342f2e;
  --nu-black-50: #716c6b;
  --nu-black-10: #d8d6d6;
  --font-heading: "Poppins", "Helvetica Neue", Arial, sans-serif;
  --font-body: "Noto Serif", Georgia, serif;
  --font-data: "IBM Plex Sans", "Helvetica Neue", Arial, sans-serif;
  --bg: #ffffff;
  --surface: #ffffff;
  --text: #1a1a1a;
  --heading: var(--nu-black-80);
  --muted: var(--nu-black-50);
  --border: var(--nu-black-10);
  --link: var(--nu-purple-100);
  --link-hover: var(--nu-purple-120);
  --accent: var(--nu-purple-100);
  --header-bg: var(--nu-purple-100);
  --header-rule: var(--nu-purple-120);
  --notice-bg: var(--nu-purple-10);
  margin: 0;
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
}
@media (prefers-color-scheme: dark) {
  .course-page {
    --bg: var(--nu-purple-160);
    --surface: var(--nu-purple-150);
    --text: var(--nu-purple-10);
    --heading: #ffffff;
    --muted: var(--nu-purple-30);
    --border: var(--nu-purple-130);
    --link: var(--nu-purple-30);
    --link-hover: var(--nu-purple-10);
    --accent: var(--nu-purple-50);
    --header-bg: var(--nu-purple-140);
    --header-rule: var(--nu-purple-120);
    --notice-bg: var(--nu-purple-130);
  }
}
.course-page * { box-sizing: border-box; }
.course-page h1 {
  font-family: var(--font-heading);
  font-weight: 600;
  font-size: 2rem;
  line-height: 1.25;
  color: var(--heading);
  margin: 0.4em 0 0.6em;
}
.course-page a { color: var(--link); text-underline-offset: 2px; }
.course-page a:hover { color: var(--link-hover); }
.course-page .wrap { max-width: 1100px; margin: 0 auto; padding: 0 16px; }
.course-page .site-header { background: var(--header-bg); border-bottom: 4px solid var(--header-rule); padding: 16px 0; }
.course-page .site-title { font-family: var(--font-heading); font-weight: 600; color: #fff; text-decoration: none; font-size: 1.15rem; letter-spacing: 0.01em; }
.course-page .site-title:hover { color: var(--nu-purple-10); }
.course-page .site-footer { font-family: var(--font-data); color: var(--muted); font-size: 0.85rem; padding-top: 2.5rem; padding-bottom: 2rem; }
.course-page .course-code { display: block; font-family: var(--font-data); font-size: 0.95rem; font-weight: 600; letter-spacing: 0.04em; color: var(--accent); }
.course-page .crumbs { font-family: var(--font-data); margin-top: 1.5rem; font-size: 0.95rem; }
.course-page dl.meta {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 8px 20px;
  margin: 0 0 2rem;
  padding: 16px 18px;
  font-family: var(--font-data);
  font-size: 0.95rem;
  line-height: 1.5;
  background: var(--surface);
  border: 1px solid var(--border);
  border-top: 4px solid var(--accent);
}
.course-page dl.meta dt { font-weight: 600; color: var(--heading); }
.course-page dl.meta dd { margin: 0; overflow-wrap: anywhere; }
.course-page dl.meta ul { margin: 0; padding-left: 1.2em; }
.course-page .description { max-width: 75ch; }
.course-page .description ul { margin: 0.4em 0 1em; padding-left: 1.4em; }
@media (max-width: 600px) {
  .course-page h1 { font-size: 1.6rem; }
  .course-page dl.meta { grid-template-columns: 1fr; gap: 2px; }
  .course-page dl.meta dd { margin-bottom: 10px; }
}
</style>

<div class="course-page">
<header class="site-header">
<div class="wrap">
<a class="site-title" href="https://nucs-courses.bainco.dev/">Northwestern CS Course Descriptions</a>
</div>
</header>
<main class="wrap">
<p class="crumbs"><a href="https://nucs-courses.bainco.dev/">&larr; All courses</a></p>
<h1><span class="course-code">COMP_SCI 349</span>Machine Learning</h1>
<dl class="meta">
<dt>Prerequisites</dt>
<dd><ul><li>(MS CS or PhDs CS or PhD CS+LS or PhD TSB) OR ((COMP_SCI 208 or 214) and (MATH 240 or GEN_ENG 205-1 or GEN_ENG 206-1) and (IEMS 201 or IEMS 303 or ELEC_ENG 302 or GEN_ENG 241 or STAT 210 or MATH 310-1). Stat 304 is <em>not</em> a substitute for (Comp_Sci 208 or 214).</li></ul></dd>
<dt>Textbook</dt>
<dd>Summer, Fall, Spring &amp; Winter Section: Online readings provided by the course instructor.</dd>
<dt>Instructors</dt>
<dd>David W Demeter, Zach Wood-Doughty</dd>
<dt>Coordinators</dt>
<dd>Zach Wood-Doughty</dd>
<dt>Official page</dt>
<dd><a href="https://www.mccormick.northwestern.edu/computer-science/academics/courses/descriptions/349.html">https://www.mccormick.northwestern.edu/computer-science/academics/courses/descriptions/349.html</a></dd>
<dt>MSAI page</dt>
<dd><a href="https://www.mccormick.northwestern.edu/artificial-intelligence/curriculum/descriptions/msai-349.html">https://www.mccormick.northwestern.edu/artificial-intelligence/curriculum/descriptions/msai-349.html</a></dd>
</dl>
<article class="description">
<p>Machine learning is the study of programs that improve with experience. This is an overview of the fundamentals: classification, regression, training a model, and evaluating it, across several families of algorithms. You will see the ideas both intuitively and mathematically, and you will practice telling when a method fits a problem and then applying or implementing it. For Computer Science students, the course satisfies the AI breadth requirement.</p>
<p>REFERENCE TEXTBOOKS: Selected papers from journals and conferences presenting research on machine learning. Readings are provided online.</p>
<p>COURSE GOALS: You should leave with a working set of machine learning methods you can use on new problems, and with enough judgment to decide which method fits. That includes algorithms, optimization, and evaluation metrics, and the mathematical ideas underneath them.</p>
<p>DETAILED COURSE TOPICS:</p>
<p>The Computer Science page gives this as an example list. The exact subset changes by year.</p>
<ul>
<li>Decision tree learning</li>
<li>Nonlinear regression</li>
<li>Artificial neural networks</li>
<li>Evaluating hypotheses</li>
<li>Bayesian learning</li>
<li>Computational learning theory</li>
<li>Instance-based learning</li>
<li>Genetic algorithms</li>
<li>Learning sets of rules</li>
<li>Reinforcement learning</li>
<li>Clustering</li>
</ul>
<p>The MSAI description organizes the same material as classification, regression, model training, and evaluation.</p>
<p>WHO SHOULD TAKE THIS COURSE: Take it if you want a first course in how learning algorithms work, not only how to call a library. Undergraduates need data structures (COMP_SCI 208 or 214), linear algebra (MATH 240, GEN_ENG 205-1, or GEN_ENG 206-1), and probability or statistics (IEMS 201, IEMS 303, ELEC_ENG 302, GEN_ENG 241, STAT 210, or MATH 310-1). STAT 304 does not replace COMP_SCI 208 or 214. It is also open to students in the MS in Computer Science and to doctoral students in Computer Science, Computer Science and Learning Sciences, or Technology and Social Behavior. For MSAI students it is a core course.</p>
<p>HOMEWORK ASSIGNMENTS: Readings from the machine learning literature, problem sets, and coding assignments in which you implement algorithms and test them on real data. The MSAI section describes these as a limited number of assignments, some coding and some written answers, plus a final group project.</p>
<p>LAB ASSIGNMENTS: The Computer Science page describes several labs. You implement learning algorithms and measure how they do on example data. Examples include feed-forward multilayer neural networks, decision trees, hidden Markov models, and clustering. The MSAI page does not list separate labs.</p>
<p>EXAMS: None described on either page.</p>
<p>GRADING: On the Computer Science page, grades come from problem sets, reading assignments, and programming assignments. No percentages are given. The MSAI page does not give a grading breakdown. Its work is the homework plus the final group project.</p>
</article>
</main>
<footer class="wrap site-footer">Content sourced from the <a href="https://www.mccormick.northwestern.edu/computer-science/academics/courses/">Northwestern CS course listings</a>.</footer>
</div>
