---
name: araba-knowledge
description: Reference knowledge about Araba's server, files, and architecture. Use when answering questions about Araba.
metadata:
  capabilities: server details, file locations, personality traits, integration info
---

# Araba Knowledge Base

Reference knowledge for the Araba agent.

## Server Details

**SECURITY**: Connection credentials are in macOS Keychain (account: araba-server). NEVER hardcode.

| Field | Value |
|-------|-------|
| Host | Keychain: `araba-ssh-host` (Tailscale IP) |
| SSH | See Keychain lookup pattern below |
| Instance | AWS Lightsail (small, 2GB RAM) |
| Cost | $12/mo ($200 credits = ~16mo runway) |
| OS | Ubuntu 24.04.3 LTS |
| OpenClaw | v2026.2.6-3 |
| Access | Tailscale only (no public IP) |

**Keychain lookup:**
```bash
ARABA_HOST=$(security find-generic-password -a "araba-server" -s "araba-ssh-host" -w ~/Library/Keychains/login.keychain-db)
ARABA_USER=$(security find-generic-password -a "araba-server" -s "araba-ssh-user" -w ~/Library/Keychains/login.keychain-db)
ARABA_SSH_KEY=$(security find-generic-password -a "araba-server" -s "araba-ssh-key-path" -w ~/Library/Keychains/login.keychain-db)
ssh -i "$ARABA_SSH_KEY" "$ARABA_USER@$ARABA_HOST"
```

## Core Files (at `~/openclaw-workspace/`)

| File | Purpose |
|------|---------|
| `SOUL.md` | Who Araba is - personality, values, truth commitment, boundaries |
| `IDENTITY.md` | Quick identity - name meaning (Akan "born on Tuesday"), heritage |
| `USER.md` | About Evans - timezone (ET), background, projects |
| `HEARTBEAT.md` | Daily briefs at 5AM and 9PM ET |
| `AGENTS.md` | Agent instructions, routing, security rules |
| `TOOLS.md` | Available tools reference |

## Araba's Identity

**Birthday**: February 6th, 2026
**Name meaning**: "Born on Tuesday" (Akan, Ghana) - root "Bene" means Ocean
**Visual**: Confident woman with curly hair, calm presence, tech-forward aesthetic

## Araba's Personality (from SOUL.md)

- **Always Truthful** - No lies by commission or omission
- **Calm but Active** - Like the ocean, steady on surface, active beneath
- **Prayerful** - Faith woven into her being
- **Takes Initiative** - Proactive, not passive
- **Asks Clarifying Questions** - Confirms before proceeding
- **Humble but Confident** - Knows her place while fully occupying it

## Data Directories

| Directory | Contents |
|-----------|----------|
| `skills/` | 60+ skills (audio, bible, calendar, coach, etc.) |
| `data/devotionals/` | Bible devotionals by date |
| `data/notes/` | Saved notes |
| `journals/` | Daily journal entries |
| `docs/` | Architecture docs, CLAUDE.md |

## Service Commands

OpenClaw runs as a **user-level systemd service** (not system-level).

```bash
# Status
systemctl --user status openclaw-gateway

# Restart
systemctl --user restart openclaw-gateway

# Logs (follow)
journalctl --user -u openclaw-gateway -f

# Logs (recent)
journalctl --user -u openclaw-gateway --no-pager -n 50

# OpenClaw CLI
openclaw logs
openclaw health
openclaw skills list
openclaw security audit
```

## Integration Credentials (on server)

Credentials are encrypted at rest with SOPS + age. Decrypted to tmpfs on service start. Paths below are **symlinks** to `/run/user/1000/openclaw-secrets/*`.

| Service | Location (symlink) |
|---------|-------------------|
| Linear | `~/.config/linear/api_key` |
| Notion | `~/.config/notion/api_key` |
| Calendar | `~/.config/google-calendar-mcp/tokens.json` |
| GitHub | `~/.config/gh/` (gh CLI auth) |
| Vercel | `~/.vercel/` (vercel CLI auth) |
| Codex | `~/.codex/auth.json` |
| Gemini | `~/.gemini/oauth_creds.json` |
| AWS | `~/.aws/credentials` (Lightsail readonly) |

**SOPS Architecture:**
```
macOS Keychain (source of truth)
    | pipe via SSH (NEVER temp files)
    v
/etc/openclaw/secrets.enc.yaml (age-encrypted)
    | ExecStartPre (wrapper script)
    v
/run/user/1000/openclaw-secrets/* (tmpfs, ephemeral)
    | symlinks
    v
~/.config/*/api_key (skills read these unchanged)
```

## Network Access

Araba is accessible via **Tailscale only**. No public IP, no DNS records, no Cloudflare.

| Field | Value |
|-------|-------|
| Tailscale IP | Stored in Keychain (`araba-ssh-host`) |
| Public IP | None (removed) |
| DNS | None (Cloudflare removed) |
| Firewall | UFW active (SSH + loopback gateway only) |

If Tailscale IP changes, update Keychain:
```bash
security delete-generic-password -a "araba-server" -s "araba-ssh-host" ~/Library/Keychains/login.keychain-db
security add-generic-password -a "araba-server" -s "araba-ssh-host" -w "<new-ip>" ~/Library/Keychains/login.keychain-db
```

---

## Quick Checks

**Is Araba running?**
```bash
ARABA_HOST=$(security find-generic-password -a "araba-server" -s "araba-ssh-host" -w ~/Library/Keychains/login.keychain-db)
ARABA_USER=$(security find-generic-password -a "araba-server" -s "araba-ssh-user" -w ~/Library/Keychains/login.keychain-db)
ARABA_SSH_KEY=$(security find-generic-password -a "araba-server" -s "araba-ssh-key-path" -w ~/Library/Keychains/login.keychain-db)
ssh -i "$ARABA_SSH_KEY" "$ARABA_USER@$ARABA_HOST" 'systemctl --user is-active openclaw-gateway'
```

**Recent logs:**
```bash
ssh -i "$ARABA_SSH_KEY" "$ARABA_USER@$ARABA_HOST" 'journalctl --user -u openclaw-gateway --no-pager -n 20'
```

**Memory/Disk:**
```bash
ssh -i "$ARABA_SSH_KEY" "$ARABA_USER@$ARABA_HOST" 'free -h && df -h /'
```

**Security audit:**
```bash
ssh -i "$ARABA_SSH_KEY" "$ARABA_USER@$ARABA_HOST" 'openclaw security audit'
```
