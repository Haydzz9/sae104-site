# CSAE 104 course site: student guide

How to register, how your progress is counted, how to submit your work and how to see your scores. The same guide is on the site under **How it works**.

## 1. Register once

1. Open the course site. On your first visit, a **Register for CSAE 104** form appears.
2. Enter your **full name**, choose your **section** (3B, 3E, 3F or 3G), and enter your **student ID number**.
3. Tick the box to agree that your progress is sent to your instructor, then click **Register**.

Tips:
- Use your real student ID. Your instructor has a class list, and your ID must be on it.
- After you register, your name, section and ID are **locked** and cannot be changed. If something is wrong, ask your instructor.
- Not a student of this class? Click **I am not a student of this class**. Nothing is sent, and you are not asked again.

## 2. What the site tracks

| What | How it counts |
|---|---|
| **Lectures** | Each lecture week fills up as you scroll through its sections. Read the whole week to reach 100% |
| **Labs** | Tick every step and every item on the "You are done when" checklist. The percentage is steps and checklist items you have ticked |
| **Quizzes** | The "Check your understanding" questions. Your score is recorded when you answer all the multiple-choice questions |

Your progress is saved on your device and sent to your instructor automatically a few seconds after you make progress, so you do not need to press anything.

Your **notes** and the answers you type in the written questions are saved on your device only. They are never sent.

## 3. Quizzes: one attempt only

- Each quiz can be taken **once**. Choose carefully: when you pick an answer it locks.
- Your answers stay locked even if you close the page or reload it, and "Reset my progress" does not clear them.
- Your first score is the one your instructor sees.

## 4. See your progress

Open **My progress** in the top menu. You see:
- a table of lecture %, lab % and quiz score for each week,
- your totals,
- your name, section and ID (locked after registration).

You can also download your progress as a file, or print it.

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
2. Choose what you are submitting (a lab, a project checkpoint or the final project).
3. Paste your repository link, for example `https://github.com/your-name/csae104-notices-board`.
4. Add the tag (for example `checkpoint-1`) or folder. For Weeks 15 and 17 add the address of your deployed site.
5. Click **Submit**.

Notes:
- You can submit the same item again to replace your link. Your first submission time is kept.
- If your repository is private, add the GitHub account shown on the page as a collaborator, so your instructor can open it.
- You must be registered first, and you must submit from the same device you registered on.
- Only GitHub links are accepted.

## 6. See your scores

When your instructor has checked your work and released the scores, they appear in **My progress > My scores**, with your score and any feedback. Press **Refresh my scores** to check for new ones. You see only your own scores.

## 7. Use another device

Your progress is saved in your browser, so a new phone or computer starts empty. To move it:
1. On the old device, open **My progress**, find **Use another device**, and click **Download backup**.
2. Send the file to yourself (email, Drive or USB).
3. On the new device, open **My progress**, click **Restore from backup**, and choose the file.

Restoring adds to what is already there and never removes anything. Keep the backup file private: it holds your identity for the course. If you lost your old device and have no backup, ask your instructor to unlock your account.

## 8. If you see a message

| Message | What to do |
|---|---|
| "Your name or student ID is not in the class list" | Check your student ID number. If it is right, tell your instructor |
| "This name is already registered on another device" | You registered on a different device. Restore your backup there, or ask your instructor to unlock you |
| "This device is registered under a different name" | The device was used to register someone else. Ask your instructor |
| "Share your progress first" | Register first (section 1), then try again |
| "Could not reach the server" | Check your internet connection and try again. Your progress is still saved on your device |
| "Use your GitHub link" | The link must start with `https://github.com/`, for example `https://github.com/your-name/csae104-notices-board` |

## 9. Your privacy

- Your instructor receives your **name, section, student ID, lecture and lab progress, quiz scores, the GitHub links you submit, and the scores they give you**.
- Your instructor does **not** receive your notes, your typed answers, your quiz answers (only your score) or your code.
- You can switch off sharing on the **My progress** page, but your instructor then cannot see your progress.
- Ask your instructor if you want to know how long the data is kept.
