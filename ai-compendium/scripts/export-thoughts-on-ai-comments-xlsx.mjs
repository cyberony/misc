#!/usr/bin/env node
import fs from "fs";
import path from "path";
import XLSX from "xlsx";

const ROOT = path.resolve(path.join(path.dirname(new URL(import.meta.url).pathname), ".."));
const ASSIGNMENT_DIR = path.join(
  ROOT,
  "data",
  "instructor-review",
  "assignments",
  "thoughts-on-ai-quiz-student-analysis-report",
);
const STUDENTS_PATH = path.join(ASSIGNMENT_DIR, "students.json");
const COMMENTS_PATH = path.join(ASSIGNMENT_DIR, "comments.json");
const OUT_PATH = path.join(ASSIGNMENT_DIR, "Thoughts on AI Quiz Student Analysis Report - with comments.xlsx");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function pickComment(entry) {
  const tr = String(entry?.transcribe || "").trim();
  const pl = String(entry?.polish || "").trim();
  const pref = entry?.exportPreferred;
  if (pref === "transcribe") return { text: tr, source: "transcribe" };
  if (pref === "polish") return { text: pl, source: "polish" };
  if (pl) return { text: pl, source: "polish" };
  if (tr) return { text: tr, source: "transcribe" };
  return { text: "", source: "" };
}

const studentsDoc = readJson(STUDENTS_PATH);
const commentsDoc = readJson(COMMENTS_PATH);
const comments = commentsDoc?.comments || {};

const rows = (studentsDoc.students || []).map((s) => {
  const c = comments[String(s.id)] || {};
  const picked = pickComment(c);
  return {
    StudentID: s.id || "",
    SISID: s.sisId || "",
    Name: s.name || "",
    Section: s.section || "",
    Submitted: s.submitted || "",
    Q1: s.answers?.[0] || "",
    Q2: s.answers?.[1] || "",
    Q3: s.answers?.[2] || "",
    Q4: s.answers?.[3] || "",
    Q5: s.answers?.[4] || "",
    InstructorCommentSelected: picked.text,
    SelectedFrom: picked.source,
  };
});

const wb = XLSX.utils.book_new();
const ws = XLSX.utils.json_to_sheet(rows);
XLSX.utils.book_append_sheet(wb, ws, "Thoughts on AI");
XLSX.writeFile(wb, OUT_PATH);

console.log(OUT_PATH);
