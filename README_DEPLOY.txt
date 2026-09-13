FOUNDATIONS OF MEDICINE MEGAHUB — WEEK 9 LAUNCH UPDATE
==========================================================

PURPOSE
-------
Merge this package into the existing Foundations of Medicine website root.
It preserves Weeks 2–8 and adds/replaces only launch files needed for Week 9,
the repaired cumulative review, the through-Week-9 review, and Make Your Own Quiz.

MERGE INTO WEBSITE ROOT
-----------------------
index.html             -> replace website_root/index.html
weeks/week9/           -> add/replace website_root/weeks/week9/
weeks/review/          -> replace/update website_root/weeks/review/
quizzes/               -> merge into website_root/quizzes/

LAUNCH CONTENT
--------------
- Root MegaHub updated through Week 9.
- Week 9 Foundations of Microbiology II hub.
- Week 9 Lecture Hub.
- 10/10 core Week 9 lecture companions + 10/10 core Factoid Sheets.
- Thursday HPC companion + Factoid.
- Human Microbiome self-paced companion + Factoid.
- Diagnostic Laboratory Immunology SAL companion + Factoid.
- Week 9 Monday, Tuesday, Wednesday 50Q daily quizzes.
- Week 9 Prequiz 50Q.
- Week 9 Comprehensive A 150Q and Comprehensive B 150Q.
- Diagnostic Laboratory Immunology SAL 50Q.
- Repaired canonical Weeks 2–8 cumulative 100Q.
- Fresh Weeks 2–9 cumulative 100Q.
- Make Your Own Quiz builder.

MAKE YOUR OWN QUIZ
------------------
Static source entries inspected: 700
Exact-unique stems available after duplicate consolidation: 491
Source scope: repaired Weeks 2–8 cumulative + fresh Weeks 2–9 cumulative +
Week 9 Monday/Tuesday/Wednesday + Week 9 Prequiz + Comprehensive A/B.
Dedicated SAL quiz banks are intentionally excluded from the custom static pool.

Builder filters:
- question count (1–100, capped to eligible pool)
- one or more weeks
- difficulty
- lecture
- searchable topic tags
- validated static bank OR active Review Bank concepts

Quiz controls retained:
- Practice and Exam modes
- confidence selection
- strikeout/eliminate choices
- Flag for Review
- explanations
- Advanced Review / reviewCheck transfer questions
- shared Review Bank tracking and mastery updates

REVIEW BANK COMPATIBILITY
-------------------------
The existing browser-local storage key remains unchanged:
  fom:review-bank:v1
No migration or reset is required.

EXISTING SITE DEPENDENCIES
--------------------------
Existing quizzes still expect the site-wide Review Bank/highly-missed assets already
present in the project. This update does not delete or replace those site-wide files.

SOURCE FILE POLICY
------------------
Faculty source PDFs/decks are intentionally excluded from this clean deployment
update. The deployable companions are self-contained and this matches the existing
MegaHub packaging convention.

STATUS
------
Week 9 core lectures: 10/10 live
Week 9 daily quizzes: 3 live
Week 9 Prequiz: live
Week 9 Comprehensive A/B: live
Week 9 SAL quiz: live
Weeks 2–8 repaired cumulative: live
Weeks 2–9 cumulative: live
Make Your Own Quiz: live
Review Mastery Bank integration: retained
