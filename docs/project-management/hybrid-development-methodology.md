# Hybrid Development Methodology

CrepFinder used a hybrid development approach. The early planning stages followed a broadly sequential structure, while the software artefact was developed iteratively using Kanban-style task tracking.

This approach matched the constraints of a dissertation project. The research aim, literature framing, ethical requirements, experimental design, and evaluation strategy needed to be planned before participant-facing implementation could be finalised. Once the core research design was fixed, implementation proceeded through small, prioritised tasks that could be refined as validity, design, and technical issues emerged.

## Sequential Planning Stage

The sequential stage established the research and implementation boundaries before the prototype was built.

| Phase | Purpose | Output |
| --- | --- | --- |
| Problem definition | Define the trust problem in peer-to-peer sneaker resale | Research aim and prototype scope |
| Literature review planning | Identify trust frameworks and marketplace trust literature | McKnight-style trust dimensions and A/B trust-cue comparison |
| Requirements definition | Decide what the research instrument must support | Consent, condition assignment, browse flow, seller evaluation, questionnaire, debrief, export |
| Ethical design | Avoid misleading participants beyond controlled prototype disclosure | Consent gate, participant codes, debrief screen, simulated-data explanation |
| Experimental design | Preserve internal validity between conditions | Between-subjects A/B design with condition parity outside the trust layer |

This stage was sequential because later stages depended on earlier decisions. For example, the prototype could not safely implement condition-specific trust cues until the study design had defined what Condition A and Condition B represented.

## Iterative Kanban-Style Implementation

After the planning stage, development moved into an iterative Kanban-style workflow. Work was managed as small cards that moved through the following columns:

| Column | Meaning |
| --- | --- |
| Backlog | Identified task, not yet started |
| Ready | Prioritised task with a clear next action |
| In Progress | Actively being implemented or refactored |
| Review / Validation | Build checks, route checks, visual checks, or wording checks |
| Done | Implemented, checked, and documented |

The actual Kanban board is recorded in [kanban-board.md](./kanban-board.md). Each task includes its rationale, affected source files, and validation evidence.

## Why Hybrid Was Appropriate

CrepFinder was both a software artefact and a research instrument. A purely sequential model would have been too rigid because implementation exposed validity issues that needed to be corrected quickly, such as visible condition labels that could reveal the experimental condition. A purely agile model would have been too loose because the dissertation had fixed academic milestones and an ethical participant flow that could not be improvised during testing.

The hybrid approach therefore gave the project enough structure to remain aligned with the dissertation plan, while preserving enough flexibility to refine the prototype as design, validity, and deployment issues emerged.

## Evidence In The Codebase

The repository reflects this methodology in three ways:

| Evidence | Location |
| --- | --- |
| Sequential research flow | `README.md`, `docs/architecture.md` |
| Kanban-style task tracking | `docs/project-management/kanban-board.md` |
| Iterative implementation record | `docs/project-management/iteration-log.md` |

The implementation itself also reflects the prioritisation logic. Validity blockers were addressed before visual polish, and research-flow features were prioritised over commercial marketplace features such as payments, recommendations, or real-time messaging.
