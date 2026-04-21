; resume.ahk — Auto-resume Claude Code session for isitavailablein project.
; Requires AutoHotkey v2 (https://www.autohotkey.com/).
;
; How to use:
;   1. Install AutoHotkey v2
;   2. Set up Windows Task Scheduler to run this script at your desired time
;      - Action: Start a program
;      - Program: "C:\Program Files\AutoHotkey\v2\AutoHotkey.exe"
;      - Arguments: "C:\Users\User\Desktop\moneymake\tools\resume.ahk"
;      - In task settings: "Wake the computer to run this task" + "Run whether user is logged on or not"
;   3. Optionally map ^!r (Ctrl+Alt+R) to trigger manually.
;
; What it does:
;   - Opens Chrome (assumed to have Claude web / Claude Code extension pinned)
;   - Sends a prompt that tells Claude to resume work from checkpoint.
;   - You still need to manually grant permissions for anything destructive.

#Requires AutoHotkey v2.0

CLAUDE_URL := "https://claude.ai/new"
CHROME_PATH := "C:\Program Files\Google\Chrome\Application\chrome.exe"

CHECKPOINT := "
(
Resume work on isitavailablein.com project at C:\Users\User\Desktop\moneymake.

Status so far: Next.js scaffold complete. DB schema, seed data (50 services x 60 countries), page templates, 3 scrapers (OpenAI, Anthropic, Netflix), GitHub Actions cron, sitemap, and README all written.

Next steps (pick up from todo list in repo):
1. Run: npm install (if not done)
2. Run: npm run seed
3. Run: npm run dev and verify at http://localhost:3000/is-chatgpt-available-in-nepal
4. Fix any build errors
5. Add more scrapers: Spotify, Coinbase, Binance, Stripe, Revolut
6. Polish: add AdSense placeholder in layout.tsx, add VPN affiliate env wiring
7. Help user deploy to Cloudflare Pages (walk through clicks)

Read the README for full context. Proceed.
)"

; Trigger: run immediately when invoked
ResumeNow()

^!r::ResumeNow()  ; Ctrl+Alt+R manual trigger

ResumeNow() {
    global CHROME_PATH, CLAUDE_URL, CHECKPOINT
    Run CHROME_PATH . ' --new-window "' . CLAUDE_URL . '"'
    Sleep 4000  ; wait for Chrome to load
    WinActivate "ahk_exe chrome.exe"
    Sleep 1500
    ; Click on the prompt input area (Claude's centered input)
    ; Coordinates may need adjustment for your screen.
    ; Safer: Tab into the textarea.
    Send "{Tab 3}"
    Sleep 300
    ; Paste the checkpoint
    A_Clipboard := CHECKPOINT
    Sleep 200
    Send "^v"
    Sleep 400
    Send "{Enter}"
}
