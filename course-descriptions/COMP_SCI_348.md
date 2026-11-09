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
<h1><span class="course-code">COMP_SCI 348</span>Intro to Artificial Intelligence</h1>
<dl class="meta">
<dt>Prerequisites</dt>
<dd><ul><li>(CS 150 or GE 150 or GE 151 or CS 111) AND (GE 231 or Stat 210 or Stat 202 or Psych 201 or CS 262 or IEMS 201 or IEMS 303 or EE 302)</li></ul></dd>
<dt>Textbook</dt>
<dd>None required</dd>
<dt>Instructors</dt>
<dd>Prof. Mohammed A. Alam, Prof. Larry Birnbaum, Prof. Mike Rubenstein, Prof. Edith Elkind</dd>
<dt>Coordinators</dt>
<dd>Prof. Kristian Hammond</dd>
<dt>Official page</dt>
<dd><a href="https://www.mccormick.northwestern.edu/computer-science/academics/courses/descriptions/348.html">https://www.mccormick.northwestern.edu/computer-science/academics/courses/descriptions/348.html</a></dd>
<dt>MSAI page</dt>
<dd><a href="https://www.mccormick.northwestern.edu/artificial-intelligence/curriculum/descriptions/msai-348.html">https://www.mccormick.northwestern.edu/artificial-intelligence/curriculum/descriptions/msai-348.html</a></dd>
</dl>
<article class="description">
<p>This course is an overview of artificial intelligence, both as a field and as a set of techniques. You will see how programs represent knowledge and use it to solve problems, make plans, reason when information is uncertain, and work with human language. The course covers classical AI and machine learning, including knowledge-based methods, search-based methods, and symbolic, statistical, and neural-network models of knowledge and learning. It also takes up the technical and philosophical problems that come with building intelligent systems. For Computer Science students, the course satisfies the AI breadth requirement.</p>
<p>OPTIONAL TEXTBOOK: Russell and Norvig, <em>Artificial Intelligence: A Modern Approach</em>, 3rd edition.</p>
<p>COURSE GOALS: You should leave able to explain the basic ideas, challenges, techniques, and problems in AI, including knowledge-based and search-based problem solving and the main models of knowledge and learning. You should be able to state the important technical and philosophical problems in the field, teach yourself more from textbooks and research articles, and apply AI techniques in problem-solving and learning systems. The MSAI section is also meant to prepare you for further study and to help you form your own views on open questions in AI.</p>
<p>DETAILED COURSE TOPICS:</p>
<ul>
<li>Philosophical foundations of artificial intelligence</li>
<li>Intelligent agents</li>
<li>Search, including A* and iterative deepening</li>
<li>Logic: propositional logic and first-order predicate calculus</li>
<li>Planning, from STRIPS to partial-order planning</li>
<li>Probability and uncertainty, including Bayesian inference and Bayes nets</li>
<li>Machine learning, including decision trees, neural networks, hill climbing, and genetic algorithms</li>
</ul>
<p>WHO SHOULD TAKE THIS COURSE: Take it if you want a first, broad course in AI. Computer Science students need an introductory programming course (COMP_SCI 111, COMP_SCI 150, GEN_ENG 150, or GEN_ENG 151) and a probability or statistics course (GEN_ENG 231, STAT 210, STAT 202, PSYCH 201, COMP_SCI 262, IEMS 201, IEMS 303, or ELEC_ENG 302). For MSAI students it is a core course. You should already be comfortable with Python, data structures (especially stacks and queues), recursion, and building and traversing trees and graphs.</p>
<p>HOMEWORK ASSIGNMENTS: In the MSAI section, weekly coding assignments. That section has no project. The Computer Science page does not list the assignments.</p>
<p>LAB ASSIGNMENTS: None described.</p>
<p>EXAMS: The MSAI section has a midterm and a final. The Computer Science page does not list exams.</p>
<p>GRADING: Not specified on either page.</p>
</article>
</main>
<footer class="wrap site-footer">Content sourced from the <a href="https://www.mccormick.northwestern.edu/computer-science/academics/courses/">Northwestern CS course listings</a>.</footer>
</div>
