---
name: skill-creator
description: Guide for creating effective skills. This skill should be used when users want to create a new skill (or update an existing skill) that extends Claude's capabilities with specialized knowledge, workflows, or tool integrations.
license: Complete terms in LICENSE.txt
---

# Skill Creator

## About Skills

Skills are a way to extend Claude's capabilities with specialized knowledge, workflows, or tool integrations. They allow Claude to provide more targeted and effective assistance for specific domains or tasks.

### What Skills Provide

- **Specialized Knowledge**: Domain-specific expertise and best practices
- **Workflow Guidance**: Step-by-step processes for complex tasks
- **Tool Integration**: Instructions for using specific software or APIs
- **Contextual Understanding**: Better awareness of particular use cases

## Core Principles

### Concise is Key

Skills should be focused and specific. Avoid trying to make a skill do everything. Instead, create multiple focused skills for different use cases.

### Set Appropriate Degrees of Freedom

Provide clear guidance while allowing flexibility for variations and edge cases.

### Anatomy of a Skill

A skill consists of:
1. **Frontmatter**: Metadata (name, description)
2. **Instructions**: Core guidance for Claude
3. **Examples**: Concrete usage scenarios
4. **Guidelines**: Best practices and constraints

### Progressive Disclosure Design Principle

Start with essential information, then provide additional details as needed.

## Skill Creation Process

### Step 1: Understanding the Skill with Concrete Examples

Before creating a skill, identify:
- What specific problem does this solve?
- Who is the target user?
- What are common use cases?
- What are the key success criteria?

### Step 2: Planning the Reusable Skill Contents

Outline the skill structure:
- Core functionality
- Edge cases to handle
- Examples to include
- Guidelines to follow

### Step 3: Initializing the Skill

Create the basic skill file with proper frontmatter:

```yaml
---
name: your-skill-name
description: Clear description of what this skill does and when to use it
---
```

### Step 4: Edit the Skill

Write the skill content:
- Start with clear instructions
- Add practical examples
- Include helpful guidelines
- Test and refine

### Step 5: Packaging a Skill

Ensure the skill is:
- Well-documented
- Properly formatted
- Tested with examples
- Ready for distribution

### Step 6: Iterate

Continuously improve the skill based on:
- User feedback
- New use cases
- Performance optimization
- Best practice updates

## Examples

### Example 1: Creating a Web Development Skill

```
User: I want to create a skill for React component development
Claude: I'll help you create a React development skill. Let me start by understanding your specific needs...
```

### Example 2: Creating a Data Analysis Skill

```
User: I need a skill for pandas data analysis
Claude: I'll create a data analysis skill focused on pandas best practices and common workflows...
```

## Guidelines

- Keep skills focused and specific
- Use clear, actionable language
- Provide concrete examples
- Test skills thoroughly
- Document limitations and edge cases
- Update skills regularly based on feedback
- Follow consistent formatting and structure
- Consider security and privacy implications
