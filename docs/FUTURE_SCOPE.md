# Future Scope: SkillGap Radar

`24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Faculty In-Charge  

---

## 1. Planned Enhancements

### 1. Integration with ESCO and O*NET Standard Taxonomies
While the current version supports manual administrative entry and AI-assisted job description parsing, a future release will integrate automated API synchronization with the European Commission's ESCO (European Skills, Competences, Qualifications and Occupations) and U.S. O*NET taxonomies.

### 2. Multi-Institutional Distributed Sharding
For multi-campus deployments (e.g., across VIT Vellore, Chennai, AP, and Bhopal), PostgreSQL foreign data wrappers (FDW) or Citus sharding can partition student records by campus while maintaining centralized career taxonomy definitions.

### 3. Cryptographically Verifiable W3C Verifiable Credentials
Rather than PDF-based academic dossiers, readiness achievements and validated skill levels can be exported as tamper-evident W3C Verifiable Credentials signed with asymmetric university keys.

### 4. Adaptive Bayesian Diagnostic Assessments
Replace fixed 3-question multiple-choice quizzes with dynamic Item Response Theory (IRT) and Bayesian knowledge tracing, adjusting question difficulty in real time based on response latencies and historical error patterns.
