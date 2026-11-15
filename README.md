# Value Tech Academy — Online Class Timetable

A responsive, static Next.js timetable for Value Tech Academy. The public schedule is loaded from `public/timetable.json`. No database or server-side application is used.

## Stack
- Next.js + React + TypeScript
- Custom responsive CSS (navy/orange brand palette)
- GitHub Pages deployment via GitHub Actions
- JSON file as the published source of truth
- Timezone: Asia/Kolkata (IST)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Manage the timetable

1. Open `/admin/`.
2. Add courses and lectures. Weekly repetition creates 12 weekly lecture records.
3. Download `timetable.json`.
4. In your GitHub repository, replace `public/timetable.json` with the downloaded file and commit to `main`.
5. GitHub Actions rebuilds and deploys the public timetable.

The admin editor is a client-side editing utility. It does not directly write to GitHub. GitHub repository write permissions are the actual publishing authorization. Anyone may open the editor, but edits remain in that browser until the JSON file is committed by an authorized repository contributor.

## GitHub Pages setup

1. Create a GitHub repository and upload this project.
2. Commit the project to the `main` branch.
3. Open **Settings → Pages**.
4. Under **Build and deployment**, choose **GitHub Actions**.
5. The included workflow builds the static export and deploys it.
6. The site URL will be `https://YOUR-USERNAME.github.io/REPOSITORY-NAME/`.

The Next.js config detects the GitHub Actions environment and applies the repository base path automatically.

## Data format

`public/timetable.json`:

```json
{
  "timezone": "Asia/Kolkata",
  "courses": [
    { "id": "python", "name": "Python Programming" }
  ],
  "lectures": [
    {
      "id": "python-2026-11-16",
      "courseId": "python",
      "title": "Python Basics",
      "instructor": "Faculty Name",
      "date": "2026-11-16",
      "startTime": "09:00",
      "endTime": "10:30",
      "meetUrl": "https://meet.google.com/your-meeting-code",
      "description": "Optional class details",
      "status": "scheduled"
    }
  ]
}
```

## Important limitations
- GitHub Pages is static hosting. This version cannot securely commit JSON changes from the browser.
- There is intentionally no fake frontend password. GitHub account/repository permissions control who can publish changes.
- Browser editor changes are temporary until exported and committed.
- Google Meet links are manually entered; this app does not create Meet sessions or sync with Google Calendar.
- Weekly repetition currently creates 12 dated occurrences; it does not create an indefinitely recurring rule.
