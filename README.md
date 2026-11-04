# Bug Hunt

A small workshop for practicing UI testing. Testers get a grocery list called **Market List** and a written spec. The build disagrees with that spec in a fixed set of places. They file bug reports, and the server confirms a report when it describes one defect clearly.

The Vue app is the product UI. The defects live in the Node server, so the exercise is the running app rather than a reading of the client code.

## Run it

Node 20 or newer.

```bash
npm install
npm test
npm run dev
```

Open http://localhost:5173

`npm test` checks the planted behavior and the scorer. A passing test run means the defects are still in the build.

## How a session works

1. Start a hunt and read the spec beside the list.
2. Exercise Market List. Some behavior matches the spec on purpose.
3. File one defect per report: area, severity, steps, expected, actual.
4. Open the answer key when the group is ready to debrief. Filing closes after that.

Reports are stored in `server/data/sessions.json` on this machine.

The answer key, repro steps, and scoring notes are in [INSTRUCTOR.md](INSTRUCTOR.md). Keep that file out of a student checkout if you share the repo.
