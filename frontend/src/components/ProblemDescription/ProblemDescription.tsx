import './ProblemDescription.css';

interface ProblemDescriptionProps {
  title?: string;
  difficulty?: string;
  description?: string;
  examples?: Array<{
    input: string;
    output: string;
    explanation?: string;
  }>;
  constraints?: string[];
  followUp?: string;
}

const TWO_SUM_PROBLEM: ProblemDescriptionProps = {
  title: '1. Two Sum',
  difficulty: 'Easy',
  description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.

You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
  examples: [
    {
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].',
    },
    {
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
    },
    {
      input: 'nums = [3,3], target = 6',
      output: '[0,1]',
    },
  ],
  constraints: [
    '2 <= nums.length <= 10⁴',
    '-10⁹ <= nums[i] <= 10⁹',
    '-10⁹ <= target <= 10⁹',
    'Only one valid answer exists.',
  ],
  followUp: 'Can you come up with an algorithm that is less than O(n²) time complexity?',
};

export function ProblemDescription({
  title = TWO_SUM_PROBLEM.title,
  difficulty = TWO_SUM_PROBLEM.difficulty,
  description = TWO_SUM_PROBLEM.description,
  examples = TWO_SUM_PROBLEM.examples,
  constraints = TWO_SUM_PROBLEM.constraints,
  followUp = TWO_SUM_PROBLEM.followUp,
}: ProblemDescriptionProps) {
  return (
    <div className="problem-description">
      <div className="problem-header">
        <div className="problem-title-row">
          <h2 className="problem-title">{title}</h2>
          <span className={`difficulty-badge difficulty-${difficulty?.toLowerCase()}`}>
            {difficulty}
          </span>
        </div>
      </div>

      <div className="problem-content">
        <div className="problem-section">
          <p className="problem-text">{description}</p>
        </div>

        {examples && examples.length > 0 && (
          <div className="problem-section">
            <h3 className="section-title">Examples:</h3>
            {examples.map((example, idx) => (
              <div key={idx} className="example">
                <div className="example-header">
                  <strong>Example {idx + 1}:</strong>
                </div>
                <div className="example-content">
                  <div className="example-line">
                    <strong>Input:</strong> <code>{example.input}</code>
                  </div>
                  <div className="example-line">
                    <strong>Output:</strong> <code>{example.output}</code>
                  </div>
                  {example.explanation && (
                    <div className="example-line">
                      <strong>Explanation:</strong> {example.explanation}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {constraints && constraints.length > 0 && (
          <div className="problem-section">
            <h3 className="section-title">Constraints:</h3>
            <ul className="constraints-list">
              {constraints.map((constraint, idx) => (
                <li key={idx}>{constraint}</li>
              ))}
            </ul>
          </div>
        )}

        {followUp && (
          <div className="problem-section">
            <div className="follow-up">
              <strong>Follow-up:</strong> {followUp}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

