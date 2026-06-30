---
layout: layouts/page.njk
title: You Have a Thing — Support
description: Help and answers for You Have a Thing, the macOS menu bar meeting reminder.
extraCss: /css/blog.css
contactJs: true
crumbs:
  - label: Apps
    url: /apps/
  - label: You Have a Thing
    url: /apps/you-have-a-thing/
  - label: Support
---

Need a hand? Email <a class="email-link" data-user="support" data-domain="lowgravitas.com">support [at] lowgravitas.com</a> and we'll get back to you.

**Requirements:** macOS 26 (Tahoe) or later.

## Frequently asked

### It's not showing my meetings

You Have a Thing needs permission to read your calendar. Open **System Settings
→ Privacy & Security → Calendars** and make sure You Have a Thing is enabled. If
you just installed it, click the menu bar icon and it'll prompt you the first
time.

### I'm not getting reminders

A few things to check:

- The app is running — look for its icon in the menu bar.
- The reminder thresholds in **Preferences** are set the way you want (how many
  minutes before a meeting the banner and the full-screen takeover appear).
- macOS isn't suppressing things — the app's notifications are its own floating
  panels, so Focus/Do Not Disturb shouldn't hide them, but it's worth a look if
  something seems off.

### It didn't find my video link

The app looks for meeting links in the event's URL, notes, and location, and
recognizes the common providers (Zoom, Google Meet, Microsoft Teams, Webex, and
many more). If a meeting has no recognizable link, there's nothing to join — and
the reminder will simply skip the **Join** button.

### What's the full-screen takeover?

For a meeting that's about to start, You Have a Thing can take over the screen so
you can't miss it. You can always:

- **Join** — opens the meeting (⌘↩)
- **Snooze** — remind me again shortly (S)
- **Dismiss** — close it (Esc)

How early it appears is up to you in **Preferences**.

### Can I show a Dock icon? / launch at login?

Yes — both are in **Preferences → General** (*Show in Dock* and *Launch at
login*).

### Is my calendar data private?

Completely. Everything stays on your Mac. See the
[Privacy Policy](/apps/you-have-a-thing/privacy/).

### How do I quit or remove it?

Quit from the menu bar menu. To uninstall, quit the app and drag it to the Trash.

## Beta testing

If you're trying an early build via TestFlight, you can send feedback right from
the TestFlight app, or email <a class="email-link" data-user="support" data-domain="lowgravitas.com">support [at] lowgravitas.com</a>. Bug reports with a
rough idea of what you were doing are gold.
