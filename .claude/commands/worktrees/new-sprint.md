# Sprint Reset - New Sprint Worktree Sync
Complete the following steps

  # 1. Make sure current branch is the one you want to sync
  git branch --show-current

  After that finishes, ask me: Get latest main branch?
  Answer response by me expcept "no", run...

  # 2. Get the latest main from origin
  git fetch origin

  After that finishes, ask me: Ready to sync?
  Answer response by me expcept "no", run...

  # OPTION A: merge main into this branch (preserves history)
  git merge origin/main

  After that finishes, run...

  # 3. Resolve conflicts if needed, then:
  git status
  git push    

  After that finishes, start new sprint on this current worktree
