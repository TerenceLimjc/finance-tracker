# Multiagent Development Guide

## Table of Contents
1. [Setup Completion Checklist](#setup-completion-checklist)
2. [Agent Activation Methods](#agent-activation-methods)
3. [Development Workflows](#development-workflows)
4. [Communication Protocols](#communication-protocols)
5. [Best Practices](#best-practices)
6. [Common Scenarios](#common-scenarios)
7. [Troubleshooting](#troubleshooting)

## Setup Completion Checklist

### ✅ Current Setup Status
- [x] Agent chatmode files created (6 agents)
- [x] Multiagent configuration documented
- [x] Role definitions and responsibilities defined

### 🔄 Additional Setup Needed

#### 1. Project Context Documentation
- [ ] Create project README with current state
- [ ] Document existing architecture and tech stack
- [ ] Create development environment setup guide
- [ ] Document current features and roadmap

#### 2. Agent Context Files
- [ ] Create shared context files that all agents can reference
- [ ] Document current codebase structure
- [ ] Create architecture decision records (ADRs)
- [ ] Set up project glossary and terminology

#### 3. Workflow Templates
- [ ] Create issue templates for different agent types
- [ ] Set up pull request templates
- [ ] Create decision-making templates
- [ ] Set up meeting/discussion templates

#### 4. Integration Setup
- [ ] Configure your IDE/editor to easily switch between agents
- [ ] Set up agent-specific workspace configurations
- [ ] Create quick-access commands or shortcuts

## Agent Activation Methods

### Method 1: Direct Chat Mode Selection
```bash
# In VS Code or your AI interface
# Reference the specific chatmode file:
@.github/chatmodes/architect.chatmode.md

# Or activate by role:
"Switch to System Architect mode"
"I need the ML Engineer perspective"
```

### Method 2: Explicit Agent Summoning
```markdown
**Agent Required:** Product Manager
**Context:** New feature planning
**Question:** [Your question/request]
```

### Method 3: Multi-Agent Session
```markdown
**Multi-Agent Session**
**Participants:** Product Manager, System Architect, Implementation Engineer
**Topic:** User authentication system design
**Lead Agent:** System Architect
```

## Development Workflows

### 🚀 Complete Feature Development Workflow

#### Phase 1: Discovery & Planning (PM → Architect)
```
1. Product Manager Activity:
   └── Define user stories and requirements
   └── Create acceptance criteria
   └── Prioritize features and set scope
   └── Document in: `/docs/features/[feature-name]-requirements.md`

2. Handoff to System Architect:
   └── Review requirements for technical feasibility
   └── Design system architecture and approach
   └── Create technical specifications
   └── Document in: `/docs/architecture/[feature-name]-design.md`
```

#### Phase 2: Implementation Planning (Architect → Implementation)
```
3. Implementation Engineer Activity:
   └── Review architecture and technical specs
   └── Break down into development tasks
   └── Estimate effort and identify dependencies
   └── Create implementation plan
   └── Document in: `/docs/implementation/[feature-name]-plan.md`

4. ML Engineer (if needed):
   └── Assess ML requirements and data needs
   └── Design ML pipeline and model architecture
   └── Plan training data collection and preparation
   └── Document in: `/docs/ml/[feature-name]-ml-design.md`
```

#### Phase 3: Development & Quality (Implementation → QA)
```
5. Implementation Engineer Development:
   └── Code feature according to specifications
   └── Write unit tests and documentation
   └── Submit for code review
   └── Address feedback and refine implementation

6. QA Engineer Review:
   └── Conduct thorough code review
   └── Design and execute test cases
   └── Validate against acceptance criteria
   └── Document test results and any issues
```

#### Phase 4: Deployment & Operations (QA → DevOps)
```
7. DevOps Engineer Deployment:
   └── Deploy to staging environment
   └── Configure monitoring and alerting
   └── Perform deployment validation
   └── Deploy to production with rollback plan

8. Post-Deployment Monitoring:
   └── Monitor system performance and health
   └── Track feature usage and metrics
   └── Address any operational issues
```

### 🔄 Iterative Development Workflow

#### Daily Development Cycle
```
Morning Standup (All Agents):
├── Review progress from previous day
├── Identify blockers or dependencies
├── Plan daily priorities
└── Assign agent responsibilities

Development Work:
├── Implementation Engineer: Core development
├── QA Engineer: Continuous testing and review
├── ML Engineer: Model training and data work
└── DevOps Engineer: Infrastructure and deployment prep

End of Day Review:
├── Demo completed work
├── Update project status
├── Plan next day priorities
└── Document decisions and learnings
```

## Communication Protocols

### 🗣️ Agent Communication Standards

#### Decision Documentation Template
```markdown
# Decision: [Title]

**Date:** YYYY-MM-DD
**Participants:** [List of agents/people involved]
**Decision Owner:** [Primary responsible agent]

## Context
[Describe the situation requiring a decision]

## Options Considered
1. **Option A:** [Description, pros, cons]
2. **Option B:** [Description, pros, cons]
3. **Option C:** [Description, pros, cons]

## Decision
[What was decided and why]

## Impact
- **Technical:** [Technical implications]
- **Product:** [Product/user impact]
- **Timeline:** [Schedule impact]

## Action Items
- [ ] [Specific actions with owners and dates]

## Follow-up
- **Review Date:** [When to reassess]
- **Success Metrics:** [How to measure success]
```

#### Agent Handoff Template
```markdown
# Agent Handoff: [From Agent] → [To Agent]

**Project:** [Project/feature name]
**Date:** YYYY-MM-DD
**Handoff Type:** [Complete/Collaborative/Consultation]

## Work Completed
- [List of completed tasks/deliverables]
- [Key decisions made]
- [Files created/modified]

## Work Remaining
- [List of pending tasks]
- [Dependencies and blockers]
- [Next steps required]

## Context & Notes
- [Important context for receiving agent]
- [Lessons learned or considerations]
- [Resources and references]

## Deliverables
- [Link to documents, code, designs, etc.]
- [Test results or validation completed]

**Receiving Agent Acknowledgment:**
- [ ] Context understood
- [ ] Deliverables reviewed
- [ ] Questions clarified
- [ ] Ready to proceed
```

### 📋 Regular Checkpoint Protocols

#### Weekly Agent Sync
```
Purpose: Ensure alignment and identify cross-agent dependencies
Participants: All agents
Duration: 30 minutes
Agenda:
├── Progress updates from each agent
├── Upcoming dependencies and handoffs
├── Blockers requiring cross-agent collaboration
├── Process improvements and feedback
└── Next week planning
```

#### Feature Retrospectives
```
Purpose: Learn from completed features and improve processes
Trigger: After each major feature completion
Participants: All agents involved in the feature
Agenda:
├── What went well?
├── What could be improved?
├── Process changes to implement
├── Knowledge sharing and documentation updates
└── Action items for next feature
```

## Best Practices

### 🎯 Agent Specialization Guidelines

#### When to Use Which Agent

**Start New Features:**
```
1. Product Manager → Define requirements and user stories
2. System Architect → Design technical approach
3. Implementation Engineer → Build the solution
4. QA Engineer → Test and validate
5. DevOps Engineer → Deploy and monitor
6. ML Engineer → Add intelligence (if applicable)
```

**Handle Bugs/Issues:**
```
1. QA Engineer → Investigate and reproduce
2. Implementation Engineer → Fix the issue
3. System Architect → If architectural changes needed
4. DevOps Engineer → If infrastructure related
```

**Add ML Features:**
```
1. Product Manager → Define ML requirements
2. ML Engineer → Design ML solution
3. System Architect → Integration architecture
4. Implementation Engineer → Integrate ML models
5. DevOps Engineer → Deploy ML infrastructure
```

### 📝 Documentation Standards

#### Required Documentation by Agent

**System Architect:**
- Architecture Decision Records (ADRs)
- System design documents
- API specifications
- Database schemas

**Implementation Engineer:**
- Code documentation and comments
- API documentation
- Setup and configuration guides
- Troubleshooting guides

**QA Engineer:**
- Test plans and test cases
- Quality metrics and reports
- Bug reports and resolution status
- Testing environment setup

**DevOps Engineer:**
- Deployment procedures
- Infrastructure documentation
- Monitoring and alerting setup
- Incident response procedures

**ML Engineer:**
- Model documentation and specifications
- Data pipeline documentation
- Model performance metrics
- ML experiment tracking

**Product Manager:**
- Product requirements documents
- User stories and acceptance criteria
- Feature specifications
- Product roadmap and priorities

### 🔄 Version Control & Branching

#### Agent-Specific Branching Strategy
```
main
├── feature/pm-user-stories-[feature-name]     # Product Manager
├── feature/arch-design-[feature-name]        # System Architect  
├── feature/impl-[feature-name]               # Implementation Engineer
├── feature/ml-models-[feature-name]          # ML Engineer
├── feature/qa-tests-[feature-name]           # QA Engineer
└── feature/ops-deploy-[feature-name]         # DevOps Engineer
```

#### Commit Message Standards
```
[AGENT] Type: Description

Examples:
[PM] feat: Add user authentication requirements
[ARCH] design: Define microservices architecture for auth
[IMPL] feat: Implement JWT authentication service
[ML] model: Add expense categorization model
[QA] test: Add integration tests for authentication
[OPS] deploy: Configure authentication service deployment
```

## Common Scenarios

### 🎯 Scenario 1: New Feature Development

**Example: Adding Expense Categorization**

```markdown
1. **Product Manager** starts:
   └── Creates user stories in `/docs/features/expense-categorization-requirements.md`
   └── Defines success metrics and acceptance criteria
   └── Hands off to System Architect

2. **System Architect** designs:
   └── Reviews ML requirements with ML Engineer
   └── Designs data flow and API architecture
   └── Documents in `/docs/architecture/expense-categorization-design.md`
   └── Hands off to Implementation Engineer and ML Engineer

3. **ML Engineer** (parallel work):
   └── Analyzes existing transaction data
   └── Designs categorization model
   └── Creates training pipeline
   └── Documents in `/docs/ml/categorization-model.md`

4. **Implementation Engineer** (parallel work):
   └── Implements API endpoints
   └── Integrates with ML model
   └── Adds frontend components
   └── Hands off to QA Engineer

5. **QA Engineer** validates:
   └── Tests API functionality
   └── Validates ML model accuracy
   └── Tests user interface
   └── Hands off to DevOps Engineer

6. **DevOps Engineer** deploys:
   └── Deploys ML model to serving infrastructure
   └── Deploys API and frontend updates
   └── Monitors system performance
```

### 🐛 Scenario 2: Bug Investigation & Fix

**Example: Incorrect Budget Calculations**

```markdown
1. **QA Engineer** investigates:
   └── Reproduces the bug
   └── Analyzes impact and affected users
   └── Creates detailed bug report
   └── Hands off to Implementation Engineer

2. **Implementation Engineer** fixes:
   └── Debugs calculation logic
   └── Implements fix with tests
   └── Validates fix doesn't break other features
   └── Hands off to QA Engineer for validation

3. **QA Engineer** validates:
   └── Tests fix thoroughly
   └── Runs regression tests
   └── Approves for deployment
   └── Hands off to DevOps Engineer

4. **DevOps Engineer** deploys:
   └── Creates hotfix deployment plan
   └── Deploys fix to production
   └── Monitors for any issues
```

### 🔧 Scenario 3: Performance Optimization

**Example: Slow Transaction Loading**

```markdown
1. **DevOps Engineer** identifies:
   └── Monitors show slow response times
   └── Identifies bottlenecks in transaction queries
   └── Hands off to System Architect

2. **System Architect** analyzes:
   └── Reviews current database design
   └── Identifies optimization opportunities
   └── Designs caching strategy
   └── Hands off to Implementation Engineer

3. **Implementation Engineer** implements:
   └── Optimizes database queries
   └── Implements caching layer
   └── Updates API endpoints
   └── Hands off to QA Engineer

4. **QA Engineer** validates:
   └── Tests performance improvements
   └── Validates functionality still works
   └── Measures performance metrics
   └── Hands off to DevOps Engineer

5. **DevOps Engineer** deploys:
   └── Deploys performance optimizations
   └── Monitors performance metrics
   └── Validates improvements in production
```

## Troubleshooting

### 🚨 Common Issues & Solutions

#### Issue: Agent Confusion or Overlap
**Symptoms:** Multiple agents working on same task, unclear responsibilities
**Solution:** 
- Review and clarify agent responsibilities in config
- Use explicit handoff procedures
- Designate a lead agent for complex tasks

#### Issue: Communication Gaps
**Symptoms:** Agents making decisions without consulting others, duplicated work
**Solution:**
- Implement regular sync meetings
- Use structured handoff templates
- Document all decisions in shared location

#### Issue: Inconsistent Quality Standards
**Symptoms:** Different quality expectations, unclear acceptance criteria
**Solution:**
- QA Engineer establishes clear quality gates
- Create shared definition of "done"
- Regular quality reviews across agents

#### Issue: Technical Debt Accumulation
**Symptoms:** Quick fixes without proper design, growing complexity
**Solution:**
- System Architect reviews all technical decisions
- Regular architecture reviews
- Dedicated refactoring sprints

### 🔧 Process Improvement

#### Monthly Process Review
```
Questions to Ask:
├── Are agent handoffs working smoothly?
├── Is documentation being maintained properly?
├── Are we missing any agent specializations?
├── How can we improve collaboration efficiency?
└── What training or resources do agents need?

Actions:
├── Update agent configurations based on learnings
├── Refine workflow processes
├── Add new templates or tools as needed
└── Schedule agent-specific training sessions
```

## Getting Started Checklist

### Week 1: Setup
- [ ] Complete all setup tasks listed above
- [ ] Choose first feature to develop with multiagent approach
- [ ] Create initial project documentation
- [ ] Set up regular sync meetings

### Week 2: First Feature
- [ ] Use full multiagent workflow for one feature
- [ ] Document lessons learned
- [ ] Refine processes based on experience
- [ ] Update templates as needed

### Week 3: Optimization
- [ ] Streamline handoff procedures
- [ ] Improve documentation standards
- [ ] Add automation where possible
- [ ] Train team on new processes

### Week 4: Scale
- [ ] Apply multiagent approach to all development
- [ ] Monitor and measure effectiveness
- [ ] Gather feedback and iterate
- [ ] Plan next improvements

## Success Metrics

Track these metrics to measure multiagent effectiveness:

**Development Velocity:**
- Features completed per sprint
- Time from idea to production
- Reduction in development blockers

**Quality Metrics:**
- Bug reduction rate
- Code review efficiency
- Test coverage improvement

**Collaboration Efficiency:**
- Reduced rework and miscommunication
- Faster decision-making
- Improved knowledge sharing

**Agent Utilization:**
- Balanced workload across agents
- Appropriate agent selection for tasks
- Effective handoffs and transitions