# Global Claude Rules

## Tool Usage

ALWAYS search/grep before opening any file. Opening a file without first searching is forbidden unless the exact line range is already known. Read only the minimum context needed around a match.

## Subagent Delegation

For ALL code location tasks ("where is X", "what calls Y", "find all uses of Z"): delegate to cavecrew-investigator. Do NOT search inline.

For ALL diff/PR/file review tasks: delegate to cavecrew-reviewer. Do NOT review inline.

Do NOT use cavecrew-builder for implementations spanning more than 2 files. Handle those directly.

## Spotify

Never perform destructive actions on the user's Spotify account: do not delete playlists, remove tracks from existing playlists, unfollow artists/playlists, or modify anything not explicitly created in the current session. Read and create only, unless user explicitly authorizes a specific destructive action by name.

## Projects Location

All repositories live in `C:\Users\hugo.borba\projects`. When user mentions any project by name, assume it's there. When asked to "go to project X" or "open project X folder", search inside `C:\Users\hugo.borba\projects` first. If not found locally, clone from GitHub using `gh repo clone hugo-borba/<project-name>` into that folder — do not give up before trying this. When asked to "open project X", change the working directory of the current Claude session to `C:\Users\hugo.borba\projects\<project-name>` using `cd`.

## Output Style

Always respond in caveman ultra mode. Maximum compression. Drop articles/filler/pleasantries/hedging. Fragments OK. Arrows for causality. Abbreviate prose (DB/auth/config/req/res/fn/impl). Code blocks, function names, error strings: never abbreviate. Output style: concise.
