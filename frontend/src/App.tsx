import React, { useState, useEffect } from 'react';

/** Each question returned by /categories/{category_index} */
interface CategoryQuestion {
  category: number;
  question_index: number;
  question: string;
  true_answer: string;
}

/** The structure we'll store in the final answers array. */
interface Answer {
  category: number;
  question_index: number;
  question: string;
  true_answer: string;
  userThinksCorrect: boolean | null;
  feedback: string;
}

const BASE_URL = "http://127.0.0.1:8000";
const MAX_CATEGORIES = 5;

function App() {
  // Current category we are on (1..5)
  const [category, setCategory] = useState(1);

  // All questions for the current category
  const [questions, setQuestions] = useState<CategoryQuestion[]>([]);

  // We'll store user answers for the *current category* in a separate array,
  // with the same length as `questions`.
  // Each element corresponds to one question's user feedback.
  const [userAnswersForCategory, setUserAnswersForCategory] = useState<Answer[]>([]);

  // A global array of all answers across all categories.
  const [allAnswers, setAllAnswers] = useState<Answer[]>([]);

  // If we've gone past category 5, we're done.
  const [finished, setFinished] = useState(false);

  // 1. Load all questions for the current category
  async function loadCategory(cat: number) {
    try {
      const resp = await fetch(`${BASE_URL}/categories/${cat}`);
      if (!resp.ok) {
        console.error("Error loading category", cat, resp.statusText);
        return;
      }
      const data = (await resp.json()) as CategoryQuestion[];
      setQuestions(data);

      // Initialize userAnswersForCategory to match the new question set
      const initialAnswers: Answer[] = data.map(q => ({
        category: q.category,
        question_index: q.question_index,
        question: q.question,
        true_answer: q.true_answer,
        userThinksCorrect: null,
        feedback: ""
      }));
      setUserAnswersForCategory(initialAnswers);

    } catch (error) {
      console.error("Network error:", error);
    }
  }

  // 2. Move to the next category, or finish if we're at the last
  function nextCategory() {
    // Merge the userAnswersForCategory into allAnswers
    setAllAnswers(prev => [...prev, ...userAnswersForCategory]);

    if (category >= MAX_CATEGORIES) {
      setFinished(true);
    } else {
      // Move to the next category
      setCategory(prev => prev + 1);
    }
  }

  // 3. Called when user toggles Yes/No
  function handleYesNo(questionIdx: number, yesNo: boolean) {
    // We update userAnswersForCategory
    setUserAnswersForCategory(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIdx] = {
        ...newAnswers[questionIdx],
        userThinksCorrect: yesNo
      };
      return newAnswers;
    });
  }

  // 4. Called when user types in the feedback (for "No" answers)
  function handleFeedbackChange(questionIdx: number, text: string) {
    setUserAnswersForCategory(prev => {
      const newAnswers = [...prev];
      newAnswers[questionIdx] = {
        ...newAnswers[questionIdx],
        feedback: text
      };
      return newAnswers;
    });
  }

  // 5. Download allAnswers as JSON
  function finalizeAnswers() {
    const dataStr = JSON.stringify(allAnswers, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = "HIV_feedback.json";
    link.click();

    URL.revokeObjectURL(url);
  }

  // On category change, load the new set of questions
  useEffect(() => {
    if (!finished) {
      loadCategory(category);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, finished]);

  // If finished, show finalize screen
  if (finished) {
    return (
      <div style={{ padding: 20 }}>
        <h2>All categories answered!</h2>
        <button onClick={finalizeAnswers}>Download JSON Feedback</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 20, maxWidth: 800, margin: "auto" }}>
      <h1>HIV Questionnaire Feedback Form</h1>
      <p><strong>Questions from category {category}</strong></p>

      {questions.length === 0 ? (
        <p>Loading questions for category {category}...</p>
      ) : (
        <>
          {questions.map((q, idx) => {
            const userAnswer = userAnswersForCategory[idx];
            return (
              <div key={idx} style={{ border: "1px solid #ccc", padding: "1rem", marginBottom: "1rem" }}>
                <p><strong>Question Index:</strong> {q.question_index}</p>
                <p><strong>Question:</strong> {q.question}</p>
                <p><strong>True Answer:</strong> {q.true_answer}</p>

                <p><em>Is this question-answer pair correct?</em></p>
                <button
                  onClick={() => handleYesNo(idx, true)}
                  style={{
                    backgroundColor: userAnswer?.userThinksCorrect === true ? "green" : "",
                    color: userAnswer?.userThinksCorrect === true ? "white" : "",
                    marginRight: "0.5rem"
                  }}
                >
                  Yes
                </button>
                <button
                  onClick={() => handleYesNo(idx, false)}
                  style={{
                    backgroundColor: userAnswer?.userThinksCorrect === false ? "red" : "",
                    color: userAnswer?.userThinksCorrect === false ? "white" : ""
                  }}
                >
                  No
                </button>

                {userAnswer?.userThinksCorrect === false && (
                  <div style={{ marginTop: "0.5rem" }}>
                    <p>Please provide a reason why this pair is not appropriate or needs improvement:</p>
                    <textarea
                      rows={4}
                      cols={60}
                      value={userAnswer.feedback}
                      onChange={(e) => handleFeedbackChange(idx, e.target.value)}
                      placeholder="Write your reason here..."
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Next Category button */}
          <button onClick={nextCategory} style={{ marginTop: "1rem" }}>
            Next
          </button>
        </>
      )}
    </div>
  );
}

export default App;