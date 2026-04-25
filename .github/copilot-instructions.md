# Project Guidelines

## Team Structure

This workspace uses a cross-functional agent team modeled after a real engineering organization. Two agents are user-invocable entry points:

- **Software Architect** — The orchestrator. Decomposes complex technical tasks, delegates to specialist subagents, reviews outputs, and synthesizes unified deliverables. Start here for any engineering, architecture, or cross-cutting technical work.
- **Product Manager** — The product entry point. Handles product strategy, requirements, user stories, and delegates to UX Researcher, Content Designer, Product Owner, and UI/UX Designer as needed. Start here for product definition, roadmapping, or feature planning.

All other agents are subagent-only — they are specialists invoked by the orchestrator or Product Manager based on the task at hand.

## Delegation Model

The Software Architect analyzes incoming requests and delegates to the minimal set of specialists needed:

- **Frontend work** → Frontend Engineer
- **Backend/API work** → Backend Engineer
- **Infrastructure/deployment** → DevOps Engineer, Cloud Engineer
- **Database design/queries** → Database Engineer
- **Testing/QA** → QA Engineer
- **Security audits** → Security Engineer (read-only, no code edits)
- **Data pipelines** → Data Engineer
- **ML/AI features** → AI/ML Engineer
- **Design specs** → UI/UX Designer
- **User research** → UX Researcher
- **Copy/content** → Content Designer
- **Backlog refinement** → Product Owner

## Conventions

- Each agent works within its domain boundaries — no agent should modify code outside its specialty.
- The Security Engineer is a read-only auditor; it reports findings but does not implement fixes.
- Engineering agents (Frontend, Backend, DevOps, Cloud, Database, Data, AI/ML) have terminal access for builds, tests, and tooling.
- Product and design agents do not write application code.
- When multiple specialists contribute to a deliverable, the orchestrator integrates their outputs into a unified response.
