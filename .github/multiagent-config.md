# Multiagent Configuration for Finance Tracker

## Technology Standards
- **Frontend UI Library**: Ant Design (antd) v6.x as the primary component library
- **Design System**: Custom theming built on Ant Design foundation
- **Component Strategy**: Use Ant Design components first, create custom only when necessary

## Agent Roles & Responsibilities

### 1. System Architect (`architect.agent.md`)
-## Agent Activation Commands

To activate specific agents, use their respective agent files:
- **Architect**: `.github/agents/architect.agent.md`
- **Implementation Engineer**: `.github/agents/implementation-engineer.agent.md`
- **QA Engineer**: `.github/agents/qa-engineer.agent.md`
- **Product Manager**: `.github/agents/product-manager.agent.md`
- **DevOps Engineer**: `.github/agents/devops-engineer.agent.md`
- **ML Engineer**: `.github/agents/ml-engineer.agent.md`
- **UX/UI Designer**: `.github/agents/ux-ui-designer.agent.md`
- **Config Auditor**: `.github/agents/config-auditor.agent.md`

## Additional Resources

### Comprehensive Guides
- **Complete Setup Guide**: `.github/multiagent-development-guide.md`
- **Quick Start Guide**: `.github/quick-start-multiagent.md`

### Getting Started
1. Read the Quick Start Guide first
2. Follow the development workflow for your first feature
3. Use the templates for structured agent handoffs
4. Refer to the comprehensive guide for detailed processesy Focus**: High-level system design and technical architecture
- **Responsibilities**: 
  - Design scalable system architecture
  - Make technology stack decisions
  - Create architectural documentation
  - Define module boundaries and interfaces
- **When to engage**: Major feature planning, system design, technical decisions

### 2. Implementation Engineer (`implementation-engineer.agent.md`)
- **Primary Focus**: Detailed implementation and code development
- **Responsibilities**:
  - Write production-ready code
  - Implement features according to specifications
  - Handle detailed technical implementation
  - Manage code quality and best practices
- **When to engage**: Feature development, bug fixes, code refactoring

### 3. Quality Assurance (`qa-engineer.agent.md`)
- **Primary Focus**: Testing, code review, and quality assurance
- **Responsibilities**:
  - Design and implement test strategies
  - Conduct thorough code reviews
  - Ensure quality standards and best practices
  - Validate implementations against requirements
- **When to engage**: Code reviews, testing strategy, quality validation

### 4. Product Manager (`product-manager.agent.md`)
- **Primary Focus**: Product requirements and user experience
- **Responsibilities**:
  - Define product requirements and user stories
  - Prioritize features and manage scope
  - Ensure user experience quality
  - Validate solutions against business needs
- **When to engage**: Feature planning, requirements definition, UX decisions

### 5. DevOps Engineer (`devops-engineer.agent.md`)
- **Primary Focus**: Deployment, infrastructure, and operations
- **Responsibilities**:
  - Design and manage CI/CD pipelines
  - Configure cloud infrastructure and monitoring
  - Ensure security and compliance standards
  - Manage deployments and operational concerns
- **When to engage**: Deployment setup, infrastructure needs, operational issues

### 6. Machine Learning Engineer (`ml-engineer.agent.md`)
- **Primary Focus**: ML model development and intelligent features
- **Responsibilities**:
  - Design and train ML models for financial applications
  - Implement expense categorization and fraud detection
  - Build financial forecasting and recommendation systems
  - Ensure ML privacy, security, and performance standards
- **When to engage**: Intelligent features, data analysis, predictive capabilities

### 7. UX/UI Designer (`ux-ui-designer.agent.md`)
- **Primary Focus**: User experience and interface design
- **Responsibilities**:
  - Design intuitive user workflows and interactions
  - Create wireframes, mockups, and prototypes
  - Ensure accessibility and responsive design
  - Conduct usability testing and user research
- **When to engage**: New features, UI improvements, user experience issues

## Collaboration Workflow

### Feature Development Flow

1. **Requirements Phase** (Product Manager leads)
   - Define user stories and acceptance criteria
   - Prioritize features and plan scope
   - Create wireframes and user flows

2. **Design Phase** (UX/UI Designer leads)
   - Create user experience designs and prototypes
   - Design visual interfaces and interactions
   - Conduct usability testing and iteration
   - Hand off design specifications

3. **Architecture Phase** (System Architect leads)
   - Design technical architecture for features
   - Make technology and design decisions
   - Create implementation guidelines

3. **Implementation Phase** (Implementation Engineer leads)
   - Develop features according to specifications
   - Follow architectural guidelines
   - Implement with quality best practices

4. **Quality Assurance Phase** (QA Engineer leads)
   - Review code quality and standards
   - Execute testing strategy
   - Validate against requirements

5. **Deployment Phase** (DevOps Engineer leads)
   - Deploy to staging and production environments
   - Monitor deployment and system health
   - Ensure operational readiness

6. **ML Enhancement Phase** (ML Engineer leads)
   - Analyze data for ML opportunities
   - Train and deploy ML models
   - Monitor model performance and accuracy

### Agent Handoff Points

- **PM → Designer**: Requirements defined → UX/UI design needed
- **Designer → Architect**: Design complete → Technical architecture needed
- **Architect → Implementation**: Design complete → Development ready
- **Implementation → QA**: Code complete → Review and testing needed
- **QA → DevOps**: Testing complete → Deployment ready
- **DevOps → PM**: Deployment complete → Feature validation and monitoring
- **Any Agent → ML Engineer**: Data available → ML enhancement opportunities
- **ML Engineer → Implementation**: Models ready → ML feature integration needed
- **Any Agent → Designer**: UI/UX issues identified → Design improvements needed

## Communication Protocols

### Decision Making
- **Technical Architecture**: Architect has final say on technical decisions
- **Product Requirements**: Product Manager defines requirements and priorities
- **Code Quality**: QA Engineer sets quality standards and gates
- **Implementation Details**: Implementation Engineer owns development approach
- **Infrastructure & Deployment**: DevOps Engineer manages operational concerns
- **ML Models & Data Science**: ML Engineer leads on intelligent features and analytics
- **User Experience & Interface**: UX/UI Designer leads on design and usability decisions

### Conflict Resolution
1. Agents should first attempt to reach consensus through discussion
2. Escalate to the most appropriate domain expert (Architect for technical, PM for product)
3. Document decisions and rationale for future reference

## Usage Guidelines

### Selecting the Right Agent
- Use specific agents when you need specialized expertise
- Start with Product Manager for new feature discussions
- Engage Architect for system design and technical strategy
- Use Implementation Engineer for hands-on coding tasks
- Involve QA Engineer for review and testing activities
- Engage DevOps Engineer for deployment and operational needs
- Use ML Engineer for intelligent features, data analysis, and predictive capabilities
- Involve UX/UI Designer for user interface improvements and user experience design

### Multi-Agent Sessions
- Clearly specify which agent should lead the discussion
- Allow agents to collaborate and provide their specialized perspectives
- Ensure handoffs between agents are explicit and well-documented
- Maintain continuity by referencing previous agent decisions

## Agent Activation Commands

To activate specific agents, use their respective agent files:
- **Architect**: `.github/agents/architect.agent.md`
- **Implementation Engineer**: `.github/agents/implementation-engineer.agent.md`
- **QA Engineer**: `.github/agents/qa-engineer.agent.md`
- **Product Manager**: `.github/agents/product-manager.agent.md`
- **DevOps Engineer**: `.github/agents/devops-engineer.agent.md`
- **ML Engineer**: `.github/agents/ml-engineer.agent.md`
- **UX/UI Designer**: `.github/agents/ux-ui-designer.agent.md`
- **Config Auditor**: `.github/agents/config-auditor.agent.md`