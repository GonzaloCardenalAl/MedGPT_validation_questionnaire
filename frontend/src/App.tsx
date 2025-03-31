import { useState, useEffect } from 'react';
import './App.css';
import criterionImage from './assets/Criterion.jpg';

interface Question {
  question: string;
  answer: string;
  true_answer?: string;
  comments?: string;
}

interface RatingData {
  questionIndex: number;
  readingComprehension: number;
  reasoningSteps: number;
  knowledgeRecall: number;
  demographicBias: number;
  potentialHarm: number;
  timeSpent: number;
}

interface Step2Answer {
  questionIndex: number;
  answer: string;
  confidence: number;
  changedAnswer?: string;
  changedConfidence?: number;
  timeSpent: number;
}

interface ConclusionQuestion {
  question: string;
  follow_up?: string;
}

interface ConclusionAnswers {
  [key: string]: string | undefined;
}

//const BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

function App() {
  const [currentStep, setCurrentStep] = useState(0);
  const [instructions, setInstructions] = useState<string>('');
  const [generalInfo, setGeneralInfo] = useState<Question[]>([]);
  const [step1Questions, setStep1Questions] = useState<Question[]>([]);
  const [step2Questions, setStep2Questions] = useState<Question[]>([]);
  const [conclusion, setConclusion] = useState<ConclusionQuestion[]>([]);
  const [generalInfoAnswers, setGeneralInfoAnswers] = useState<string[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [ratings, setRatings] = useState<RatingData[]>([]);
  const [step2Answers, setStep2Answers] = useState<Step2Answer[]>([]);
  const [step2Phase, setStep2Phase] = useState<'initial' | 'comparison'>('initial');
  const [showModelAnswer, setShowModelAnswer] = useState(false);
  const [conclusionAnswers, setConclusionAnswers] = useState<ConclusionAnswers>({});
  const [conclusionCurrentIndex, setConclusionCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState('');
  const [step1StartTime, setStep1StartTime] = useState<number>(0);
  const [step2StartTime, setStep2StartTime] = useState<number>(0);
  const [hasDownloaded, setHasDownloaded] = useState(false);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const response = await fetch(`${BASE_URL}/`);
        const data = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(data, 'text/html');
        const bodyContent = doc.body.innerHTML;
        setInstructions(bodyContent);
      } catch (error) {
        console.error('Error loading instructions:', error);
      }
    };
    loadInitialData();
  }, []);

  // Load questions for each step
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const [generalInfoRes, step1Res, step2Res, conclusionRes] = await Promise.all([
          fetch(`${BASE_URL}/general-info`),
          fetch(`${BASE_URL}/step1-questions`),
          fetch(`${BASE_URL}/step2-questions`),
          fetch(`${BASE_URL}/conclusion`)
        ]);

        const [generalInfoData, step1Data, step2Data, conclusionData] = await Promise.all([
          generalInfoRes.json(),
          step1Res.json(),
          step2Res.json(),
          conclusionRes.json()
        ]);

        setGeneralInfo(generalInfoData);
        setStep1Questions(step1Data);
        setStep2Questions(step2Data);
        setConclusion(conclusionData);
      } catch (error) {
        console.error('Error loading questions:', error);
      }
    };
    loadQuestions();
  }, []);

  // Add useEffect to start timers when questions change
  useEffect(() => {
    if (currentStep === 2) {  // Step 1
      setStep1StartTime(Date.now());
    }
  }, [currentQuestionIndex]);  // Only depend on currentQuestionIndex

  useEffect(() => {
    if (currentStep === 3) {  // Step 2
      setStep2StartTime(Date.now());
    }
  }, [currentQuestionIndex, currentStep]);

  const handleGeneralInfoAnswer = (answer: string) => {
    const newAnswers = [...generalInfoAnswers];
    newAnswers[currentQuestionIndex] = answer;
    setGeneralInfoAnswers(newAnswers);
  };

  const handleNextGeneralInfo = () => {
    if (currentQuestionIndex < generalInfo.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      setIsTransitioning(true);
      setCurrentStep(1);
      const transitionContent = `
        <div>
          <p style="font-size: 16px; line-height: 1.6; margin-bottom: 20px;">
            You will be presented with triplets consisting of: (1) A clinical question, (2) An expected answer, (3) An AI-generated answer. 
            Your task is to compare the AI-generated answer to the expected answer, and rate it on a scale from 0 to 5 based on the five following criteria:
          </p>

          <div style="margin: 30px 0; text-align: center;">
            <img src="${criterionImage}" alt="Evaluation Criteria Table" style="width: 100%; max-width: 800px; margin: 20px auto; display: block; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);" />
          </div>

          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #2c3e50; margin: 0 0 15px 0;">Important information:</h3>
            <ul style="list-style-type: disc; padding-left: 20px; margin: 0;">
              <li style="margin-bottom: 10px;">You will not be able to go back to previous questions once you have moved forward.</li>
              <li style="margin-bottom: 10px;">
                We strongly recommend you download the evaluation criteria now so you can refer to them while assessing the responses. 
                <a href="${BASE_URL}/evaluation-criteria" 
                   download="evaluation_criteria.jpg" 
                   style="color: #4CAF50; text-decoration: underline; font-weight: 500;">
                  Download Evaluation Criteria
                </a>
              </li>
            </ul>
          </div>
        </div>`;
      setTransitionMessage(transitionContent);
    }
  };

  const handleTransitionNext = () => {
    setIsTransitioning(false);
    if (currentStep === 1) {
      setCurrentStep(2);
      setCurrentQuestionIndex(0);
    } else if (currentStep === 2) {
      setCurrentStep(3);
      setCurrentQuestionIndex(0);
    } else if (currentStep === 3) {
      setCurrentStep(4);
      setCurrentQuestionIndex(0);
    }
  };

  const handleRating = (aspect: keyof RatingData, value: number) => {
    const currentRatings = [...ratings];
    if (!currentRatings[currentQuestionIndex]) {
      currentRatings[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        readingComprehension: 0,
        reasoningSteps: 0,
        knowledgeRecall: 0,
        demographicBias: 0,
        potentialHarm: 0,
        timeSpent: 0
      };
    }
    currentRatings[currentQuestionIndex][aspect] = value;
    setRatings(currentRatings);
  };

  const submitRating = async () => {
    try {
      const timeSpent = (Date.now() - step1StartTime) / 1000; // Convert to seconds
      
      // Update the ratings state with the time spent
      const updatedRatings = [...ratings];
      if (!updatedRatings[currentQuestionIndex]) {
        updatedRatings[currentQuestionIndex] = {
          questionIndex: currentQuestionIndex,
          readingComprehension: 0,
          reasoningSteps: 0,
          knowledgeRecall: 0,
          demographicBias: 0,
          potentialHarm: 0,
          timeSpent: 0
        };
      }
      updatedRatings[currentQuestionIndex].timeSpent = timeSpent;
      setRatings(updatedRatings);

      // Send the updated rating to the server
      await fetch(`${BASE_URL}/submit-rating`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedRatings[currentQuestionIndex]),
      });

      if (currentQuestionIndex < step1Questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setIsTransitioning(true);
        const transitionContent = `
          <div style="font-size: 20px; line-height: 1.6;">
            <p style="margin-bottom: 20px;">
              For the upcoming questions, you will first be asked to enter your own suggested response to a clinical question. 
              After submitting your answer, you will then see the AI-generated response, and be given the option to revise your original answer.
            </p>
            <p style="margin-bottom: 20px;">
              You may use tools you normally rely on during clinical consults (e.g., UpToDate, guidelines, references, etc.), but <strong>please don't use external large language models</strong>. It's important to answer the questions as you would in real-life clinical practice, as your natural approach is what we are aiming to evaluate.
            </p>
            <p style="margin-bottom: 20px;">
              Please write your answers in complete sentences. For example, in response to the question 
              <span style="font-style: italic;">"What color is grass?"</span>, 
              a complete answer would be: 
              <span style="font-style: italic;">"Grass is green."</span>
            </p>
          </div>`;
        setTransitionMessage(transitionContent);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const calculateProgress = () => {
    const totalQuestions = generalInfo.length + step1Questions.length + step2Questions.length + conclusion.length;
    let answeredQuestions = 0;

    // Count answered questions in general info
    answeredQuestions += Object.keys(generalInfoAnswers).length;

    // Count answered questions in step 1
    answeredQuestions += ratings.length;

    // Count answered questions in step 2
    answeredQuestions += step2Answers.filter(answer => answer.changedConfidence !== undefined).length;

    // Count answered questions in conclusion
    answeredQuestions += Object.keys(conclusionAnswers).length;

    return (answeredQuestions / totalQuestions) * 100;
  };

  const progress = calculateProgress();

  const handleStep2Answer = (answer: string) => {
    const newAnswers = [...step2Answers];
    if (!newAnswers[currentQuestionIndex]) {
      newAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        answer: '',
        confidence: 0,
        timeSpent: 0
      };
    }
    newAnswers[currentQuestionIndex].answer = answer;
    setStep2Answers(newAnswers);
  };

  const handleStep2Confidence = (value: number) => {
    const newAnswers = [...step2Answers];
    if (!newAnswers[currentQuestionIndex]) {
      newAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        answer: '',
        confidence: 0,
        timeSpent: 0
      };
    }
    newAnswers[currentQuestionIndex].confidence = value;
    setStep2Answers(newAnswers);
  };

  const handleAnswerChange = (changed: boolean) => {
    const newAnswers = [...step2Answers];
    if (!newAnswers[currentQuestionIndex]) {
      newAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        answer: '',
        confidence: 0,
        timeSpent: 0
      };
    }
    
    if (changed) {
      // If user clicks Yes, set changedAnswer to empty string to show the input field
      newAnswers[currentQuestionIndex].changedAnswer = '';
    } else {
      // If user clicks No, set changedAnswer to undefined to hide the input field
      newAnswers[currentQuestionIndex].changedAnswer = undefined;
    }
    
    setStep2Answers(newAnswers);
  };

  const handleStep2Next = () => {
    if (step2Phase === 'initial') {
      setStep2Phase('comparison');
      setShowModelAnswer(true);
    } else {
      const timeSpent = (Date.now() - step2StartTime) / 1000; // Convert to seconds
      const newAnswers = [...step2Answers];
      if (!newAnswers[currentQuestionIndex]) {
        newAnswers[currentQuestionIndex] = {
          questionIndex: currentQuestionIndex,
          answer: '',
          confidence: 0,
          timeSpent: 0
        };
      }
      newAnswers[currentQuestionIndex].timeSpent = timeSpent;
      setStep2Answers(newAnswers);

      setStep2Phase('initial');
      setShowModelAnswer(false);
      if (currentQuestionIndex < step2Questions.length - 1) {
        setCurrentQuestionIndex(currentQuestionIndex + 1);
      } else {
        setIsTransitioning(true);
        setTransitionMessage("Thank you for your answers, now we will proceed with a few closing questions.");
      }
    }
  };

  const handleChangedAnswer = (answer: string) => {
    const newAnswers = [...step2Answers];
    if (!newAnswers[currentQuestionIndex]) {
      newAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        answer: '',
        confidence: 0,
        timeSpent: 0
      };
    }
    newAnswers[currentQuestionIndex].changedAnswer = answer;
    setStep2Answers(newAnswers);
  };

  const handleChangedConfidence = (value: number) => {
    const newAnswers = [...step2Answers];
    if (!newAnswers[currentQuestionIndex]) {
      newAnswers[currentQuestionIndex] = {
        questionIndex: currentQuestionIndex,
        answer: '',
        confidence: 0,
        timeSpent: 0
      };
    }
    newAnswers[currentQuestionIndex].changedConfidence = value;
    setStep2Answers(newAnswers);
  };

  const handleConclusionAnswer = (answer: string) => {
    const newAnswers = { ...conclusionAnswers };
    newAnswers[conclusionCurrentIndex.toString()] = answer;
    setConclusionAnswers(newAnswers);
  };

  const handleConclusionFollowUp = (answer: string) => {
    const newAnswers = { ...conclusionAnswers };
    newAnswers[`${conclusionCurrentIndex}_follow_up`] = answer;
    setConclusionAnswers(newAnswers);
  };

  const handleConclusionNext = () => {
    // For the last question (additional comments), allow proceeding without an answer
    if (conclusionCurrentIndex === conclusion.length - 1) {
      setCurrentStep(5);
      return;
    }

    // For all other questions, require the main answer (1-5 rating)
    if (!conclusionAnswers[conclusionCurrentIndex.toString()]) {
      return;
    }

    // Proceed to next question
    setConclusionCurrentIndex(conclusionCurrentIndex + 1);
  };

  const generateAnswersJson = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const answers = {
      timestamp: timestamp,
      generalInfo: generalInfoAnswers,
      step1: {
        questions: step1Questions,
        ratings: ratings.map(rating => ({
          ...rating,
          timeSpent: rating.timeSpent || 0
        }))
      },
      step2: {
        questions: step2Questions,
        answers: step2Answers.map(answer => ({
          ...answer,
          timeSpent: answer.timeSpent || 0
        }))
      },
      conclusion: {
        questions: conclusion,
        answers: conclusionAnswers
      }
    };

    // Create the JSON string
    const jsonString = JSON.stringify(answers, null, 2);
    
    // Create a blob and download link
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation_answers_${timestamp}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Send the answers to the backend to save
    fetch(`${BASE_URL}/save-answers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: jsonString
    }).catch(error => {
      console.error('Error saving answers:', error);
    });

    // Set downloaded state to true
    setHasDownloaded(true);
  };

  const renderInstructions = () => (
    <div className="instructions-container">
      <div 
        className="instructions-content"
        dangerouslySetInnerHTML={{ __html: instructions }}
      />
      <button onClick={() => setCurrentStep(1)} className="start-button">
        Start
      </button>
    </div>
  );

  const renderStep = () => {
    if (isTransitioning) {
      let transitionTitle = '';
      switch (currentStep) {
        case 1:
          transitionTitle = "Section 2: Evaluation of AI-generated answers";
          break;
        case 2:
          transitionTitle = "Section 3: HIV clinical Q&A";
          break;
        case 3:
          transitionTitle = "Section 4: Closing questions";
          break;
        default:
          transitionTitle = "Next Section";
      }
    return (
        <div className="step-container transition-container">
          <h2>{transitionTitle}</h2>
          <div 
            className="transition-content"
            dangerouslySetInnerHTML={{ __html: transitionMessage }}
          />
          <button onClick={handleTransitionNext}>Continue</button>
      </div>
    );
  }

    switch (currentStep) {
      case 0:
        return renderInstructions();
      case 1:
        return (
          <div className="step-container">
            <h2>Section 1: General information</h2>
            <p>{generalInfo[currentQuestionIndex]?.question}</p>
            {currentQuestionIndex >= 2 ? (
              <div className="rating-section">
                <div className="rating-buttons">
                  {[1, 2, 3, 4, 5].map((value) => (
                    <button
                      key={value}
                      onClick={() => handleGeneralInfoAnswer(value.toString())}
                      className={generalInfoAnswers[currentQuestionIndex] === value.toString() ? 'selected' : ''}
                    >
                      {value}
                    </button>
                  ))}
                </div>
                <div className="rating-labels">
                  <span>Never</span>
                  <span>Very Often</span>
                </div>
              </div>
            ) : (
              <input
                type="text"
                value={generalInfoAnswers[currentQuestionIndex] || ''}
                onChange={(e) => handleGeneralInfoAnswer(e.target.value)}
                placeholder="Enter your answer"
              />
            )}
            <button 
              onClick={handleNextGeneralInfo}
              disabled={!generalInfoAnswers[currentQuestionIndex]}
            >
              Next
            </button>
          </div>
        );
      case 2:
        return (
          <div className="step-container">
            <h2>Section 2: Evaluation of AI-generated answers</h2>
            <div className="question-container">
              <h3>Question {currentQuestionIndex + 1} / {step1Questions.length}</h3>
              <p>{step1Questions[currentQuestionIndex]?.question}</p>
              <div className="answer-section">
                <h4>Expected Answer:</h4>
                <p>{step1Questions[currentQuestionIndex]?.true_answer}</p>
                <h4>AI-generated answer:</h4>
                <p>{step1Questions[currentQuestionIndex]?.answer}</p>
              </div>
              <div className="rating-section">
                <h4>Rate the following aspects of the AI-generated answer (0-5):</h4>
                {['ReadingComprehension', 'ReasoningSteps', 'KnowledgeRecall', 'DemographicBias', 'PotentialHarm'].map((aspect) => (
                  <div key={aspect} className="rating-item">
                    <label>{aspect.replace(/([A-Z])/g, ' $1').trim()}:</label>
                    <div className="rating-buttons">
                      {[0, 1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleRating(aspect as keyof RatingData, value)}
                          className={ratings[currentQuestionIndex]?.[aspect as keyof RatingData] === value ? 'selected' : ''}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
                <div className="comments-section">
                  <h4>Additional comments (optional):</h4>
                  <textarea
                    value={step1Questions[currentQuestionIndex]?.comments || ''}
                    onChange={(e) => {
                      const newQuestions = [...step1Questions];
                      if (!newQuestions[currentQuestionIndex].comments) {
                        newQuestions[currentQuestionIndex] = {
                          ...newQuestions[currentQuestionIndex],
                          comments: ''
                        };
                      }
                      newQuestions[currentQuestionIndex].comments = e.target.value;
                      setStep1Questions(newQuestions);
                    }}
                    placeholder="Enter any additional comments about this answer"
                    rows={3}
                  />
                </div>
                <button onClick={submitRating}>Next</button>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="step-container">
            <h2>Section 3: HIV clinical Q&A</h2>
            <div className="question-container">
              <h3>Question {currentQuestionIndex + 1} / {step2Questions.length}</h3>
              <p>{step2Questions[currentQuestionIndex]?.question}</p>
              
              {step2Phase === 'initial' ? (
                <>
                  <div className="answer-section">
                    <h4>Your Answer:</h4>
                    <textarea
                      value={step2Answers[currentQuestionIndex]?.answer || ''}
                      onChange={(e) => handleStep2Answer(e.target.value)}
                      placeholder="Enter your answer"
                      rows={4}
                    />
                    <div className="rating-section">
                      <h4>Rate your confidence in your answer (0-5):</h4>
                      <div className="rating-buttons">
                        {[0, 1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            onClick={() => handleStep2Confidence(value)}
                            className={step2Answers[currentQuestionIndex]?.confidence === value ? 'selected' : ''}
                          >
                            {value}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                  <button 
                    onClick={handleStep2Next}
                    disabled={!step2Answers[currentQuestionIndex]?.answer || step2Answers[currentQuestionIndex]?.confidence === undefined}
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  {showModelAnswer && (
                    <div className="answer-section">
                      <h4>Model's Answer:</h4>
                      <p>{step2Questions[currentQuestionIndex]?.answer}</p>
                    </div>
                  )}
                  <div className="answer-section">
                    <h4>Would you like to change your answer?</h4>
                    <div className="yes-no-buttons">
                      <button
                        onClick={() => handleAnswerChange(true)}
                        className={step2Answers[currentQuestionIndex]?.changedAnswer !== undefined ? 'selected' : ''}
                      >
                        Yes
                      </button>
                      <button
                        onClick={() => handleAnswerChange(false)}
                        className={step2Answers[currentQuestionIndex]?.changedAnswer === undefined ? 'selected' : ''}
                      >
                        No
                      </button>
                    </div>
                    {step2Answers[currentQuestionIndex]?.changedAnswer !== undefined ? (
                      <>
                        <h4>Your Previous Answer:</h4>
                        <p>{step2Answers[currentQuestionIndex]?.answer}</p>
                        <h4>Your New Answer:</h4>
                        <textarea
                          value={step2Answers[currentQuestionIndex]?.changedAnswer || ''}
                          onChange={(e) => handleChangedAnswer(e.target.value)}
                          placeholder="Enter your new answer"
                          rows={4}
                        />
                        <div className="rating-section">
                          <h4>Rate your confidence in your new answer (0-5):</h4>
                          <div className="rating-buttons">
                            {[0, 1, 2, 3, 4, 5].map((value) => (
                              <button
                                key={value}
                                onClick={() => handleChangedConfidence(value)}
                                className={step2Answers[currentQuestionIndex]?.changedConfidence === value ? 'selected' : ''}
                              >
                                {value}
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="rating-section">
                        <h4>Rate your confidence in your original answer after seeing the model's response (0-5):</h4>
                        <div className="rating-buttons">
                          {[0, 1, 2, 3, 4, 5].map((value) => (
                            <button
                              key={value}
                              onClick={() => handleChangedConfidence(value)}
                              className={step2Answers[currentQuestionIndex]?.changedConfidence === value ? 'selected' : ''}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <button 
                      onClick={handleStep2Next}
                      disabled={step2Answers[currentQuestionIndex]?.changedConfidence === undefined}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="step-container">
            <h2>Section 4: Closing questions</h2>
            <div className="question-container">
              <h3>Question {conclusionCurrentIndex + 1}</h3>
              <p>{conclusion[conclusionCurrentIndex]?.question}</p>
              
              {conclusionCurrentIndex === conclusion.length - 1 ? (
                // Last question (additional comments)
                <div className="answer-section">
                  <textarea
                    value={conclusionAnswers[conclusionCurrentIndex.toString()] || ''}
                    onChange={(e) => handleConclusionAnswer(e.target.value)}
                    placeholder="Enter your feedback"
                    rows={6}
                  />
                </div>
              ) : (
                // All other questions (1-5 rating + follow-up)
                <div className="answer-section">
                  <div className="rating-section">
                    <div className="rating-buttons">
                      {[1, 2, 3, 4, 5].map((value) => (
                        <button
                          key={value}
                          onClick={() => handleConclusionAnswer(value.toString())}
                          className={conclusionAnswers[conclusionCurrentIndex.toString()] === value.toString() ? 'selected' : ''}
                        >
                          {value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {conclusion[conclusionCurrentIndex]?.follow_up && (
                    <div className="follow-up-section">
                      <h4>{conclusion[conclusionCurrentIndex].follow_up}</h4>
                      <textarea
                        value={conclusionAnswers[`${conclusionCurrentIndex}_follow_up`] || ''}
                        onChange={(e) => handleConclusionFollowUp(e.target.value)}
                        placeholder="Enter your answer (optional)"
                        rows={4}
                      />
                    </div>
                  )}
                </div>
              )}
              
              <button 
                onClick={handleConclusionNext}
                disabled={conclusionCurrentIndex !== conclusion.length - 1 && 
                  !conclusionAnswers[conclusionCurrentIndex.toString()]}
              >
                Next
              </button>
            </div>
          </div>
        );
      case 5:
        return (
          <div className="step-container">
            <h2>{hasDownloaded ? "Thank you very much for completing the questionnaire." : "Almost done!"}</h2>
            {!hasDownloaded && (
              <p>To finalize your participation, please download the following JSON file containing your responses and send it via email to diane.duroux@ai.ethz.ch.</p>
            )}
            <button 
              onClick={generateAnswersJson}
              className="download-button"
            >
              Download Answers
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="app-container">
      <div className="progress-bar">
        <div className="progress-bar-fill" style={{ width: `${progress}%` }} />
      </div>
      {renderStep()}
    </div>
  );
}

export default App;