import { useState, useEffect } from 'react';

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

//const BASE_URL = "http://127.0.0.1:8000";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const MAX_CATEGORIES = 5;

function App() {
  // Current category we are on (1..5)
  const [category, setCategory] = useState(1);

  // All questions for the current category
  const [questions, setQuestions] = useState<Categor