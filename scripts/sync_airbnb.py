#!/usr/bin/env python3
"""Update public blocked-night calendar from two private Airbnb iCal feeds.

Airbnb URLs must be saved in GitHub Actions secrets; never commit them.
On missing secrets or errors, exit unsuccessfully without replacing availability.json.
"""
import datetime as dt
import json
import os
import pathlib
import sys
import urllib.request

FEEDS = {
    "Le Petit Chalet": os.environ.get("AIRBNB_ICAL_PETIT", ""),
    "Passo nel Cielo": os.environ.get("AIRBNB_ICAL_PASSO", ""),
}
OUTPUT = pathlib.Path("availability.json")


def fetch(url):
    if not url.startswith("https://") or "/calendar/ical/" not in url:
        raise ValueError("Invalid iCal link")
    request = urllib.request.Request(url, headers={"User-Agent": "CerviniaMountainStay-Availability/1.0"})
    with urllib.request.urlopen(request, timeout=35) as response:
        data = response.read(3_000_000)
    text = data.decode("utf-8-sig", errors="replace")
    if "BEGIN:VCALENDAR" not in text or "END:VCALENDAR" not in text:
        raise ValueError("Not a valid iCalendar document")
    return text


def unfold(text):
    unfolded = []
    for raw in text.replace("\r\n", "\n").split("\n"):
        if raw.startswith((" ", "\t")) and unfolded:
            unfolded[-1] += raw[1:]
        else:
            unfolded.append(raw)
    return unfolded


def date_of(value):
    value = value.strip()
    # Airbnb iCal values are typically YYYYMMDD; accept timestamp as well.
    return dt.datetime.strptime(value[:8], "%Y%m%d").date()


def blocked_nights(text, today):
    result = set()
    inside = False
    fields = {}
    seen = 0
    for line in unfold(text):
        if line == "BEGIN:VEVENT":
            inside = True
            fields = {}
        elif line == "END:VEVENT" and inside:
            inside = False
            seen += 1
            if fields.get("STATUS", "").upper() == "CANCELLED":
                continue
            if "DTSTART" not in fields or "DTEND" not in fields:
                continue
            start = date_of(fields["DTSTART"])
            end = date_of(fields["DTEND"])  # DTEND is exclusive
            if end <= start or end - start > dt.timedelta(days=730):
                continue
            day = max(start, today)
            horizon = today + dt.timedelta(days=730)
            while day < min(end, horizon):
                result.add(day.isoformat())
                day += dt.timedelta(days=1)
        elif inside and ":" in line:
            k, v = line.split(":", 1)
            fields[k.split(";", 1)[0].upper()] = v
    return sorted(result), seen


def main():
    if any(not value for value in FEEDS.values()):
        raise ValueError("Both AIRBNB_ICAL_PETIT and AIRBNB_ICAL_PASSO secrets are required")
    now = dt.datetime.now(dt.timezone.utc)
    today = now.date()
    properties = {}
    counts = []
    for label, url in FEEDS.items():
        nights, events = blocked_nights(fetch(url), today)
        properties[label] = {"blocked": nights}
        counts.append(events)
    result = {
        "connected": True,
        "updated_at": now.isoformat(timespec="seconds"),
        "properties": properties,
        "status": {label: "synced" for label in FEEDS}
    }
    # Write only after BOTH feeds were fetched and parsed.
    OUTPUT.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print("Calendar feeds synced successfully:", ", ".join(str(x) + " events" for x in counts))


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        # Avoid printing secret URL (some errors contain it).
        print("Calendar sync failed. Verify Airbnb export links and GitHub secrets.", file=sys.stderr)
        sys.exit(1)
