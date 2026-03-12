### AI Usage Statement

### Tools Used
- **Cursor** — primary coding assistant  
- **Claude Code** — code review and requirement validation

### How AI Was Used

#### 1. Project Scaffolding
I used Cursor to help scaffold the initial Vue 3 project using Vite and the required stack (Vue 3, Composition API, `<script setup>`).  
Cursor assisted with generating the initial project structure and some boilerplate components.

#### 2. Implementation Assistance
Cursor was used as a coding assistant to help implement certain pieces of functionality.

**Typical interactions included:**
- generating initial implementations for components or composables  
- suggesting patterns for Vue Composition API usage  
- helping structure data fetching and state management  
- assisting with pagination and filtering logic  
- generating or scaffolding tests for key functionality  

I reviewed all generated code, tested it locally, and modified it where necessary.

#### 3. Product, UX, and Design Decisions
All product and UX decisions were made by me, including:
- deciding what actions and buttons should exist in the interface  
- designing the pagination behavior  
- choosing how records should be displayed and inspected  
- refining layout and interaction details  

I manually tested the application locally and adjusted UI and interaction patterns when they did not feel correct or intuitive.

#### 4. Manual Testing and Iteration
Throughout development I:
- ran the application locally  
- manually tested core flows  
- refined UI layout and interaction details  
- corrected issues discovered during testing  

#### 5. Code Review
After completing the main implementation, I used Claude Code to review the pull request.

Claude provided feedback on:
- potential edge cases  
- code clarity  
- structure improvements  
- possible bugs  

I evaluated this feedback and addressed the suggestions that improved the codebase.

#### 6. Requirement Verification
I also asked Claude Code to verify the implementation against the requirements specified in the exercise document to ensure that:
- required technologies were used  
- core functionality was implemented  
- the solution aligned with the stated expectations  

### Ownership of the Final Solution
AI tools were used as assistants, not as autonomous developers.  
All architectural decisions, design choices, and final code acceptance were made by me.  
I reviewed, tested, and refined the code to ensure the final submission reflects my engineering judgment and meets the requirements of the exercise.
