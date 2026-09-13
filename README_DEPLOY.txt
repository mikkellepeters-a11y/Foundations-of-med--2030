WEEK 2 WEBSITE UPDATE - READY TO MERGE
======================================

Purpose
-------
This folder contains the canonical deployable Week 2 website update for
Cellular & Molecular Foundations. It is organized to merge directly into the
Foundations of Medicine website root.

Copy these folders into the website root:
  weeks/week2/  -> website_root/weeks/week2/
  quizzes/      -> website_root/quizzes/

Included Week 2 study content
-----------------------------
- Main Week 2 MegaHub: weeks/week2/index.html
- Deep Study Lecture Hub: weeks/week2/lecture-hub/index.html
- 10/10 core lecture companions
- 10/10 core Factoid Sheets
- HTML + PDF versions of every core companion and Factoid Sheet
- 2 Structured Active Learning sessions (CMP and CBC/Peripheral Blood)
- Holistic Patient Care session
- Evidence-Based Medicine / Biostats skills session
- Ozzy/completion tracking in lecture materials
- Assigned resource links in the Deep Study Lecture Hub
- Shared Review Bank access button on the weekly MegaHub
- Updated Week 2 molecular-structure symbol with tan weekly-hub icon background
- Thursday listed as HPC only

Included Week 2 quizzes (9 total)
---------------------------------
- week2_monday_daily_50.html
- week2_tuesday_daily_50.html
- week2_wednesday_daily_50.html
- week2_thursday_hpc_10.html
- week2_prequiz_50.html
- week2_comprehensive_a_150.html
- week2_comprehensive_b_150.html
- week2_sal_cmp_50.html
- week2_sal_cbc_peripheral_blood_50.html

Important deployment notes
--------------------------
- The Week 2 MegaHub is already wired to the quiz filenames above.
- Quiz back buttons expect the standard site structure: ../weeks/week2/index.html
  from website_root/quizzes/.
- The Week 2 MegaHub back button expects website_root/index.html.
- Shared Review Bank storage key remains: fom:review-bank:v1
- Quiz review controls expect the existing site-wide shared assets at
  website_root/shared/review-bank.js and website_root/review/highly_missed.html.
  Those are course-wide dependencies, so they are intentionally not duplicated
  inside this Week 2-only update folder.
- Individual lecture companions do NOT use the Week 2 week symbol. The symbol
  is reserved for week-level hub branding.
- Source faculty decks, temporary render folders, and intermediate build ZIPs
  are intentionally excluded. This is a clean website deployment package.

Status at packaging
-------------------
Core lectures: 10/10
SAL sessions: 2/2
HPC: complete
EBM/Biostats: complete
Quiz banks: 9 live
Comprehensive questions: 300 live across A + B

PDF REMOVAL NOTE
----------------
This Week 2 patch intentionally excludes all PDF copies. HTML companions, Factoid Sheets, hubs, and quizzes remain included.
