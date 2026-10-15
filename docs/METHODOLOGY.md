# Methodology: SkillGap Radar

**Student:** Garudaiahgari Sai Siri Chandana | **Register Number:** `24BAI0226`  
**Course:** BCSE302P Database Systems Lab | **Slot:** `L25+L26` | **Faculty:** Dr. V. SIVAKUMAR  

---

## 1. Mathematical Scoring & Gap Analysis Formulation

### Step 1: Raw Assessment Scoring & Proficiency Derivation
When a student completes a diagnostic quiz on skill $s$, raw score $S_s$ is calculated:
$$S_s = \left(\frac{\text{Correct Answers}}{\text{Total Questions}}\right) \times 100$$

The PostgreSQL trigger `trg_before_assessment_24BAI0226_SaiSiriChandana` intercepts `INSERT` on `assessment_attempts` and computes the discrete proficiency level $A_s \in \{1, 2, 3, 4, 5\}$:
$$A_s = \begin{cases} 
5 & \text{if } S_s \ge 90\% \\
4 & \text{if } 75\% \le S_s < 90\% \\
3 & \text{if } 60\% \le S_s < 75\% \\
2 & \text{if } 40\% \le S_s < 60\% \\
1 & \text{if } S_s < 40\%
\end{cases}$$

### Step 2: Competency Gap Computation
For target role version $v$ with required proficiency $R_s$, the gap $G_s$ is:
$$G_s = \max(R_s - A_s, 0)$$

### Step 3: Weighted Priority Score Calculation
To prioritize student focus, the stored procedure `sp_generate_gap_report_24BAI0226_SaiSiriChandana` weights each gap by the role's assigned importance weight $W_s \in [1, 5]$:
$$Q_s = \text{round}\left(W_s \times \frac{G_s}{5.0}, 2\right)$$

### Step 4: Aggregate Career Readiness Percentage
$$\text{Readiness \%} = \text{round}\left(\frac{\sum [G_s = 0]}{\text{Total Skills in Version}} \times 100.0, 2\right)$$

---

## 2. SkillGap Radar 360 Simulator Methodology

1. **Baseline Ingestion**: Read the latest verified assessment attempt for each skill $s \in \text{Role}$.
2. **Hypothetical Input**: Student supplies simulated levels $A'_s \in [0, 5]$.
3. **Simulated Gap & Readiness**:
   $$G'_s = \max(R_s - A'_s, 0)$$
   $$\text{Simulated Readiness \%} = \text{round}\left(\frac{\sum [G'_s = 0]}{\text{Total Skills}} \times 100.0, 2\right)$$
   $$\text{Readiness Gain \%} = \text{Simulated Readiness \%} - \text{Baseline Readiness \%}$$
4. **Prerequisite Guardrail Verification**:
   For any skill $s$ where $A'_s > A_s$, inspect all prerequisite edges $(p \to s) \in \text{SkillPrerequisites}$. If $A'_p < 3$, flag a DAG dependency violation alert.
5. **Cross-Role Leverage Score**:
   For any skill $s$ appearing across $K$ active job roles with importance weights $W_{s, k}$:
   $$\text{Leverage Score}_s = K \times \sum_{k=1}^K W_{s, k}$$
