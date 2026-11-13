# CSAE 104 course site: student guide

How to register, how your progress is counted, how to submit your work and how to see your scores. The same guide is on the site under **How it works**. New to the site or to Git? The site also has a **Getting started** page with a weekly routine, how to use the lecture and lab pages, and a step-by-step Git and GitHub guide.

## In short

1. **Register once** with your name, section and student ID.
2. **Study and do your labs.** Your progress is sent to your instructor automatically. You do not press anything.
3. **Submit your GitHub link** for each lab and project checkpoint on the **My progress** page.
4. **Check your scores** on the same page after your instructor releases them.

## 1. Register once

1. Open the course site. On your first visit, a **Register for CSAE 104** form appears.
2. Enter your **full name**, choose your **section** (3B, 3E, 3F or 3G), and enter your **student ID number**.
3. Tick the box to agree that your progress is sent to your instructor, then click **Register**.

Tips:
- Use your real student ID, exactly as it appears on your school records. Your instructor has a class list, and your ID must be on it.
- After you register, your name, section and ID are **locked** and cannot be changed. If something is wrong, ask your instructor.
- The registration belongs to the **device** you used. To use another phone or computer, see section 7.
- Not a student of this class? Click **I am not a student of this class**. Nothing is sent, and you are not asked again.

## 2. What the site tracks

| What | How it counts |
|---|---|
| **Lectures** | Each lecture week fills up as you scroll through its sections. Read the whole week to reach 100% |
| **Labs** | Tick every step and every item on the "You are done when" checklist. The percentage is the steps and checklist items you have ticked |
| **Quizzes** | The "Check your understanding" questions. Your score is recorded when you answer all the multiple-choice questions |

**You do not need to press anything to send your progress.**
- It is saved on your device and sent to your instructor a few seconds after you make progress.
- It is sent once when you open the site.
- Anything not yet sent goes out when you close the page, switch to another tab or leave the site.
- The **Send now (optional)** button on My progress is only a backup, for example if you want to be sure before you switch off your phone.

Your **notes** and the answers you type in the written questions are saved on your device only. They are never sent.

If your progress shows 0%, check that you are registered and that sharing is switched on (see **My progress**). Lectures count as you scroll, so a week you only opened is not complete.

## 3. Quizzes: one attempt only

- Each quiz can be taken **once**. Choose carefully: when you pick an answer it locks.
- Your answers stay locked even if you close the page or reload it, and "Reset my progress" does not clear them.
- Your first score is the one your instructor sees.
- You can stop in the middle and carry on later. The answers you already gave stay locked.

## 4. The My progress page

Open **My progress** in the top menu. You see:
- your name, section and student ID (locked after registration),
- a table of lecture %, lab % and quiz score for each week, with your totals,
- **My scores**: the marks for your graded work (section 6),
- **Submit my work** (section 5),
- **Use another device** (section 7),
- the sharing box. You can switch sharing off, but your instructor then cannot see your progress,
- buttons to download your progress as a file or print it.

"Reset my progress" at the bottom of the site clears your reading progress, lab steps and notes on this device. It does not clear your quiz answers, your registration or your sharing choice.

## 5. Submit your lab work

Your lab work lives in your own **GitHub repository**. You keep one repository for the whole semester.

**Set up (Lab 1 and Lab 5)**
1. In Lab 1, you create a folder called `csae104-notices-board` and run `git init` there. This is your repository for the whole semester.
2. In Lab 5, you create a free GitHub account and an empty repository with the same name, and push your work to it.

**After each lab**
1. Save your work into its folder inside `csae104-notices-board`.
2. In the terminal, in that folder, run:
   ```
   git add .
   git commit -m "Finish Lab 6"
   git push
   ```

**For project checkpoints** (Weeks 6, 8, 11, 16 and 17) also tag the commit:
```
git tag checkpoint-1
git push --tags
```
Use `checkpoint-2`, `checkpoint-3` and so on for the later ones.

**Then submit the link on the site**
1. Open **My progress** and find **Submit my work**.
2. Choose what you are submitting (a lab, a project checkpoint or the final project). There is no Lab 9 item, because that week is the midterm.
3. Paste your repository link, for example `https://github.com/your-name/csae104-notices-board`.
4. Add the tag (for example `checkpoint-1`) or folder. For Weeks 15 and 17 add the address of your deployed site.
5. Click **Submit**.

Notes:
- You can submit the same item again to replace your link. Your first submission time is kept.
- If your repository is private, add the GitHub account shown on the page as a collaborator, so your instructor can open it.
- You must be registered first, and you must submit from the same device you registered on.
- Only GitHub links are accepted.
- A submission is not a grade. Your instructor checks your repository and gives a score later.

## 6. See your scores

When your instructor has checked your work and released the scores, they appear in **My progress > My scores**, with your score and any feedback.
- Each item shows your score out of the total points, and as a percentage.
- Under the table you see your **total so far** across the graded work.
- Press **Refresh my scores** to check for new ones.
- You see only your own scores. A score does not appear until your instructor releases it.

## 7. Use another device

Your progress and registration are saved in your browser, so a new phone or computer starts empty. To move them:
1. On the old device, open **My progress**, find **Use another device**, and click **Download backup**.
2. Send the file to yourself (email, Drive or USB).
3. On the new device, open **My progress**, click **Restore from backup**, and choose the file.

Restoring adds to what is already there and never removes anything. It also carries your registration, so the new device is recognised. Keep the backup file private: it holds your identity for the course.

If you lost your old device and have no backup, ask your instructor to unlock your account. Your progress then starts again on the new device.

## 8. If you see a message

| Message | What to do |
|---|---|
| "Your name or student ID is not in the class list" | Check your student ID number. If it is right, tell your instructor |
| "Enter your student ID number…" or "Your student ID is missing" | Type your student ID in the box on My progress (or in the form), then press **Send now** |
| "Your account was created before the student ID was required" | Enter your student ID number in the box, then press **Send now (optional)**. If it then says "registered under a different name", tell your instructor |
| "This name is already registered on another device" | You registered on a different device. Restore your backup there, or ask your instructor to unlock you |
| "This device is registered under a different name" | The device was used to register someone else. Ask your instructor |
| "Share your progress first" | Register first (section 1), then try again |
| "Could not reach the server" | Check your internet connection and try again. Your progress is still saved on your device and is sent next time you open the site |
| "Use your GitHub link" | The link must start with `https://github.com/`, for example `https://github.com/your-name/csae104-notices-board` |
| "No scores have been released yet" | Your instructor has not released scores. Check again later |

## 9. Questions

**Do I have to press a button to send my progress?** No. It is sent automatically while you study and when you close the page.

**Can I change my name or student ID?** Not after registering. Ask your instructor.

**Can I retake a quiz?** No. Each quiz is a single attempt. Ask your instructor if something went wrong.

**I use a school computer and share it with others. Is that a problem?** Your registration belongs to that browser. Once one student has registered in it, another student using the same browser cannot register separately. Use your own device or your own browser profile, or ask your instructor.

**What if I clear my browser data?** You lose your progress on that device and your registration. Restore a backup if you have one, or ask your instructor to unlock you.

## 10. Your privacy

- Your instructor receives your **name, section, student ID, lecture and lab progress, quiz scores, the GitHub links you submit, and the scores they give you**.
- Your instructor does **not** receive your notes, your typed answers, your quiz answers (only your score) or your code.
- You can switch off sharing on the **My progress** page, but your instructor then cannot see your progress.
- Ask your instructor if you want to know how long the data is kept.
