FOUNDATIONS OF MEDICINE MEGAHUB — CBL UPDATE PATCH
==================================================

PURPOSE
-------
Adds the new module-level "Case-Based Learning" resource to the Foundations
of Medicine MegaHub.

WHAT THIS PATCH DOES
--------------------
1. Replaces the website-root index.html with an updated copy that adds a
   "Case-Based Learning" card beside the existing module-level resources.

2. Adds:
      weeks/cbl/index.html

3. Adds the live CBL resources for Weeks 3–9:
   - Week 3 Case Quiz + Quick Guide
   - Week 4 Case Quiz + Quick Guide
   - Week 5 Case Quiz + Quick Guide
   - Week 6 Case Quiz + Quick Guide
   - Week 7 Case Quiz + Quick Guide
   - Week 8 Case Quiz + Quick Guide
   - Week 9 Case Quiz + Quick Guide

4. Week 10 is displayed as:
      COMING SOON
   It has no quiz or quick-guide file yet because that case has not occurred.

QUIZ FEATURES INCLUDED
----------------------
- Practice Mode
- Exam Mode
- Advanced Review
- Confidence rating
- Strikeout
- Flag for Review
- Show Flagged
- Silent topic labels
- Hunter endscreen

DEPLOYMENT
----------
Merge this ZIP into the Foundations of Medicine website root.

The folder structure is already correct:

  index.html
  weeks/
    cbl/
      index.html
      week3_case_quiz_30.html
      week3_case_quick_guide.html
      ...
      week9_case_quiz_28.html
      week9_case_quick_guide.html

Allow index.html to replace the current website-root index.html.
No existing weekly folders or quiz files are replaced by this patch.

LINKS
-----
Main MegaHub:
  index.html
      -> weeks/cbl/index.html

CBL quiz and quick-guide links are self-contained inside weeks/cbl/.
All quiz back buttons return to weeks/cbl/index.html.

STATUS
------
Weeks 3–9: LIVE
Week 10: COMING SOON
