# Agent Decision Templates

## Architecture Decision Record (ADR) Template
*Use this when System Architect makes design decisions*

```markdown
# ADR-001: [Decision Title]

**Date:** YYYY-MM-DD
**Status:** [Proposed/Accepted/Deprecated/Superseded]
**Deciders:** System Architect + [other involved agents]

## Context
What is the issue we're trying to solve?

## Decision Drivers
- [driver 1, e.g., a force, concern, ...]
- [driver 2, e.g., a force, concern, ...]
- ...

## Considered Options
- [option 1]
- [option 2]  
- [option 3]

## Decision Outcome
Chosen option: "[option 1]", because [justification].

### Positive Consequences
- [e.g., improvement of quality attribute satisfaction, ...]
- ...

### Negative Consequences
- [e.g., compromising quality attribute, ...]
- ...

## Implementation
- [implementation details]
- [migration steps if needed]

## Validation
How will we know this decision was correct?
- [success criteria]
- [metrics to track]
```

## Product Requirements Document (PRD) Template  
*Use this when Product Manager defines features*

```markdown
# PRD: [Feature Name]

**Product Manager:** [Name]
**Date:** YYYY-MM-DD
**Priority:** [High/Medium/Low]
**Target Release:** [Release version/date]

## Problem Statement
What user problem are we solving?

## Success Metrics
How will we measure success?
- [Metric 1]: [Target value]
- [Metric 2]: [Target value]

## User Stories
As a [user type], I want [goal] so that [reason].

### Acceptance Criteria
- [ ] [Specific, testable criteria]
- [ ] [Specific, testable criteria]

## User Experience
- [Wireframes/mockups if applicable]
- [User flow description]
- [Edge cases and error states]

## Technical Considerations
- [Performance requirements]
- [Security considerations]  
- [Integration points]

## Out of Scope
What are we explicitly NOT doing?

## Dependencies
- [Internal dependencies]
- [External dependencies]
- [Blocking issues]

## Handoff to Architecture
Ready for System Architect when:
- [ ] Requirements are clear and approved
- [ ] Success metrics defined
- [ ] User stories complete
- [ ] Dependencies identified
```

## Implementation Plan Template
*Use this when Implementation Engineer plans development*

```markdown
# Implementation Plan: [Feature Name]

**Implementation Engineer:** [Name]
**Date:** YYYY-MM-DD
**Estimated Effort:** [Hours/Days]
**Dependencies:** [List blockers]

## Architecture Review
- [ ] Reviewed architectural design
- [ ] Understood integration points
- [ ] Clarified technical requirements
- [ ] Identified potential risks

## Development Tasks
### Frontend Tasks
- [ ] [Task 1] - [Estimate]
- [ ] [Task 2] - [Estimate]

### Backend Tasks  
- [ ] [Task 1] - [Estimate]
- [ ] [Task 2] - [Estimate]

### Database Tasks
- [ ] [Task 1] - [Estimate]
- [ ] [Task 2] - [Estimate]

### Testing Tasks
- [ ] Unit tests for [component]
- [ ] Integration tests for [workflow]
- [ ] End-to-end test scenarios

## Technical Approach
### Key Components
- [Component 1]: [Purpose and approach]
- [Component 2]: [Purpose and approach]

### Integration Points
- [System A]: [How we integrate]
- [System B]: [How we integrate]

### Error Handling
- [Error scenario 1]: [Handling approach]
- [Error scenario 2]: [Handling approach]

## Risk Assessment
- **High Risk:** [Risk and mitigation]
- **Medium Risk:** [Risk and mitigation]
- **Low Risk:** [Risk and monitoring]

## Definition of Done
- [ ] Code complete and reviewed
- [ ] Tests passing
- [ ] Documentation updated
- [ ] Ready for QA handoff

## Handoff to QA
Ready for QA Engineer when:
- [ ] All development tasks complete
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Code reviewed and approved
- [ ] Documentation updated
```

## Quality Assurance Report Template
*Use this when QA Engineer completes testing*

```markdown
# QA Report: [Feature Name]

**QA Engineer:** [Name]
**Date:** YYYY-MM-DD
**Test Period:** [Start date] to [End date]
**Overall Status:** [Pass/Fail/Pass with Issues]

## Test Summary
- **Total Test Cases:** [Number]
- **Passed:** [Number]
- **Failed:** [Number]
- **Blocked:** [Number]

## Test Coverage
### Functional Testing
- [ ] Feature functionality - [Pass/Fail]
- [ ] Edge cases - [Pass/Fail]  
- [ ] Error scenarios - [Pass/Fail]
- [ ] User workflows - [Pass/Fail]

### Non-Functional Testing
- [ ] Performance - [Pass/Fail]
- [ ] Security - [Pass/Fail]
- [ ] Accessibility - [Pass/Fail]
- [ ] Browser compatibility - [Pass/Fail]

### Integration Testing
- [ ] API integrations - [Pass/Fail]
- [ ] Database operations - [Pass/Fail]
- [ ] Third-party services - [Pass/Fail]

## Issues Found
### Critical Issues
- [Issue 1]: [Description and status]
- [Issue 2]: [Description and status]

### Major Issues  
- [Issue 1]: [Description and status]

### Minor Issues
- [Issue 1]: [Description and status]

## Code Review Findings
### Positive Highlights
- [Good practice 1]
- [Good practice 2]

### Areas for Improvement
- [Improvement 1]: [Suggestion]
- [Improvement 2]: [Suggestion]

## Performance Metrics
- **Load Time:** [Measurement]
- **Response Time:** [Measurement]
- **Memory Usage:** [Measurement]

## Recommendations
- [Recommendation 1]
- [Recommendation 2]

## Deployment Readiness
- [ ] All critical issues resolved
- [ ] Performance meets requirements
- [ ] Security review complete
- [ ] Documentation updated
- [ ] Ready for DevOps handoff

## Handoff to DevOps
Ready for deployment when:
- [ ] All tests passing
- [ ] Issues resolved or accepted
- [ ] Performance validated
- [ ] Security approved
```

## ML Model Development Template
*Use this when ML Engineer develops models*

```markdown
# ML Development Report: [Model Name]

**ML Engineer:** [Name]
**Date:** YYYY-MM-DD  
**Model Version:** [Version number]
**Status:** [Development/Training/Testing/Ready]

## Problem Definition
### Business Objective
What business problem does this model solve?

### ML Problem Type
- [Classification/Regression/Clustering/etc.]
- [Supervised/Unsupervised/Reinforcement]

### Success Criteria
- **Accuracy Target:** [Percentage]
- **Performance Target:** [Response time]
- **Business Impact:** [Measurable outcome]

## Data Analysis
### Dataset Summary
- **Size:** [Number of samples]
- **Features:** [Number and types]
- **Target:** [Description]
- **Quality:** [Assessment]

### Data Issues
- **Missing Values:** [Percentage and handling]
- **Outliers:** [Detection and treatment]
- **Imbalanced Classes:** [Distribution and handling]

## Model Development
### Algorithms Tested
1. **[Algorithm 1]**
   - Accuracy: [Score]
   - Precision: [Score]  
   - Recall: [Score]
   - F1-Score: [Score]

2. **[Algorithm 2]**
   - Accuracy: [Score]
   - Precision: [Score]
   - Recall: [Score] 
   - F1-Score: [Score]

### Final Model Selection
**Chosen Algorithm:** [Name and reasoning]

### Model Performance
- **Training Accuracy:** [Score]
- **Validation Accuracy:** [Score]
- **Test Accuracy:** [Score]
- **Cross-validation Score:** [Score]

### Feature Importance
- [Feature 1]: [Importance score]
- [Feature 2]: [Importance score]
- [Feature 3]: [Importance score]

## Model Deployment Plan
### Infrastructure Requirements
- **Compute:** [CPU/GPU requirements]
- **Memory:** [RAM requirements]
- **Storage:** [Disk space needed]

### API Design
- **Endpoint:** [URL pattern]
- **Input Format:** [JSON schema]
- **Output Format:** [JSON schema]
- **Response Time:** [Target latency]

### Monitoring Plan
- **Model Drift:** [Detection method]
- **Data Drift:** [Detection method]
- **Performance:** [Metrics to track]

## Ethical Considerations
- **Bias Assessment:** [Findings]
- **Fairness Metrics:** [Results]
- **Privacy Concerns:** [Addressed how]

## Next Steps
- [ ] Model validation complete
- [ ] Integration testing planned
- [ ] Deployment infrastructure ready
- [ ] Monitoring systems configured

## Handoff to Implementation
Ready for integration when:
- [ ] Model performance validated
- [ ] API endpoints defined
- [ ] Integration requirements clear
- [ ] Deployment plan approved
```

## UX/UI Design Brief Template
*Use this when UX/UI Designer creates design specifications*

```markdown
# Design Brief: [Feature/Page Name]

**UX/UI Designer:** [Name]
**Date:** YYYY-MM-DD
**Design Phase:** [Research/Wireframing/Visual Design/Prototyping]
**Target Devices:** [Mobile/Tablet/Desktop/All]

## Project Overview
### Design Objective
What user problem are we solving through design?

### Success Criteria
How will we measure design success?
- **Usability Goal:** [Specific metric, e.g., task completion rate >90%]
- **User Satisfaction:** [Target score, e.g., SUS score >80]
- **Business Goal:** [Conversion rate, engagement, etc.]

## User Research Findings
### Target Users
- **Primary Persona:** [Name and key characteristics]
- **Secondary Persona:** [Name and key characteristics]

### Key User Needs
- [Need 1]: [Description and priority]
- [Need 2]: [Description and priority]
- [Need 3]: [Description and priority]

### Pain Points Identified
- [Pain point 1]: [Current user frustration]
- [Pain point 2]: [Current user frustration]

## Design Requirements
### Functional Requirements
- [ ] [Feature requirement 1]
- [ ] [Feature requirement 2]
- [ ] [Feature requirement 3]

### Design Constraints
- **Technical Limitations:** [Platform/performance constraints]
- **Brand Guidelines:** [Brand compliance requirements]
- **Accessibility:** [WCAG compliance level required]
- **Timeline:** [Design delivery deadlines]

### Content Requirements
- **Copy/Microcopy:** [Text and messaging needs]
- **Images/Assets:** [Visual content requirements]
- **Data Display:** [Information architecture needs]

## Design Solutions
### Information Architecture
- **Navigation Structure:** [How users will navigate]
- **Content Hierarchy:** [Priority of information display]
- **User Flow:** [Step-by-step user journey]

### Interaction Design
- **Key Interactions:** [Primary user actions]
- **Micro-interactions:** [Feedback and animation details]
- **Error Handling:** [How errors are communicated]
- **Loading States:** [How waiting is communicated]

### Visual Design
- **Layout Structure:** [Grid system and spacing]
- **Color Scheme:** [Primary and secondary colors]
- **Typography:** [Font hierarchy and sizing]
- **Iconography:** [Icon style and usage]

## Responsive Design
### Mobile (320-768px)
- **Layout Adaptations:** [How layout changes]
- **Navigation:** [Mobile navigation pattern]
- **Touch Targets:** [Minimum size and spacing]

### Tablet (768-1024px)
- **Layout Adaptations:** [How layout changes]
- **Interaction Patterns:** [Touch/stylus considerations]

### Desktop (1024px+)
- **Layout Adaptations:** [How layout changes]
- **Keyboard Support:** [Keyboard navigation and shortcuts]

## Accessibility Considerations
- **Color Contrast:** [Compliance verification]
- **Keyboard Navigation:** [Tab order and focus management]
- **Screen Reader Support:** [ARIA labels and semantic structure]
- **Motor Accessibility:** [Large touch targets, simplified interactions]

## Design Deliverables
### Research Phase
- [ ] User interview findings
- [ ] Competitive analysis
- [ ] User personas
- [ ] User journey maps

### Design Phase
- [ ] Low-fidelity wireframes
- [ ] High-fidelity mockups
- [ ] Interactive prototypes
- [ ] Design specifications

### Testing Phase
- [ ] Usability testing plan
- [ ] Test results and insights
- [ ] Design iteration recommendations
- [ ] Final design validation

## Technical Specifications
### Design System Components
- **New Components:** [Components to be created]
- **Existing Components:** [Components to be reused]
- **Component Variations:** [Modifications needed]

### Asset Requirements
- **Icons:** [List of icons needed with specifications]
- **Images:** [Image requirements and optimization specs]
- **Animations:** [Animation specifications and timing]

### Implementation Notes
- **CSS/Styling:** [Specific styling requirements]
- **Responsive Breakpoints:** [Exact breakpoint specifications]
- **Performance:** [Image optimization and loading requirements]

## Testing & Validation
### Usability Testing Plan
- **Test Scenarios:** [Key user tasks to test]
- **Success Metrics:** [How to measure task success]
- **Participant Criteria:** [Who should test the design]

### A/B Testing (if applicable)
- **Variant A:** [Description of design option 1]
- **Variant B:** [Description of design option 2]
- **Success Metric:** [How to determine winner]

## Handoff Requirements
### For Implementation Engineer
- [ ] Design specifications document
- [ ] Asset exports (SVG, PNG, etc.)
- [ ] Interactive prototype
- [ ] Component documentation
- [ ] Animation specifications

### For QA Engineer
- [ ] Usability testing results
- [ ] Accessibility checklist
- [ ] Cross-browser testing requirements
- [ ] Responsive design test cases

### For Product Manager
- [ ] User research insights
- [ ] Design rationale documentation
- [ ] Success metrics and KPIs
- [ ] User feedback integration plan

## Post-Launch Plans
- **Analytics Tracking:** [What user behavior to monitor]
- **Iteration Plan:** [Timeline for design improvements]
- **User Feedback:** [How to collect and integrate feedback]
- **Performance Monitoring:** [Design impact on performance]
```

## DevOps Deployment Template  
*Use this when DevOps Engineer handles deployments*

```markdown
# Deployment Plan: [Feature/Release Name]

**DevOps Engineer:** [Name]
**Date:** YYYY-MM-DD
**Target Environment:** [Staging/Production]
**Deployment Type:** [Blue-Green/Rolling/Canary]

## Pre-Deployment Checklist
### Environment Validation
- [ ] Target environment healthy
- [ ] Database migrations tested
- [ ] Configuration validated
- [ ] Secrets/credentials updated

### Application Readiness
- [ ] Code review complete
- [ ] Tests passing in CI/CD
- [ ] Performance testing complete
- [ ] Security scan passed

### Infrastructure Readiness
- [ ] Compute resources available
- [ ] Load balancers configured
- [ ] Monitoring systems ready
- [ ] Backup procedures validated

## Deployment Steps
### Phase 1: Pre-deployment
1. [ ] Create deployment backup
2. [ ] Run database migrations (if needed)
3. [ ] Update configuration
4. [ ] Verify dependencies

### Phase 2: Deployment
1. [ ] Deploy to staging
2. [ ] Run smoke tests
3. [ ] Deploy to production
4. [ ] Verify deployment success

### Phase 3: Post-deployment
1. [ ] Monitor system health
2. [ ] Validate functionality
3. [ ] Check performance metrics
4. [ ] Update documentation

## Rollback Plan
### Rollback Triggers
- [Trigger 1]: [Response procedure]
- [Trigger 2]: [Response procedure]

### Rollback Steps
1. [ ] Stop traffic to new version
2. [ ] Route traffic to previous version
3. [ ] Rollback database (if needed)
4. [ ] Verify system stability

## Monitoring & Alerts
### Key Metrics
- **Application Health:** [Endpoints to monitor]
- **Performance:** [Response time thresholds]
- **Errors:** [Error rate thresholds]
- **Infrastructure:** [CPU, memory, disk usage]

### Alert Configuration
- **Critical Alerts:** [SMS/Phone notifications]
- **Warning Alerts:** [Email/Slack notifications]
- **Info Alerts:** [Dashboard/logs only]

## Risk Assessment
- **Low Risk Changes:** [List]
- **Medium Risk Changes:** [List and mitigation]
- **High Risk Changes:** [List and mitigation]

## Success Criteria
- [ ] Zero downtime deployment
- [ ] All health checks passing
- [ ] Performance within SLA
- [ ] No critical errors

## Post-Deployment Tasks
- [ ] Monitor for [X] hours
- [ ] Update deployment documentation
- [ ] Conduct deployment retrospective
- [ ] Plan next deployment cycle
```