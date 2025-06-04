import React, { useState } from 'react';
import axios from 'axios';

const questions = [
    "What is your preferred car type? (e.g., SUV, Sedan, Sports car)",
    "What is your budget range?",
    "What features are most important to you? (e.g., fuel efficiency, safety, performance)",
    "How do you plan to use the car? (e.g., daily commute, family trips, weekend drives)",
    "What is your preferred brand or any specific brands you prefer to avoid?"
];

const CarChatBot: React.FC = () => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        if (!currentAnswer.trim()) {
            setError('Please provide an answer before proceeding.');
            return;
        }

        if (currentQuestion < questions.length - 1) {
            setAnswers([...answers, currentAnswer]);
            setCurrentAnswer('');
            setCurrentQuestion(currentQuestion + 1);
            setError(null);
        } else {
            setIsLoading(true);
            setError(null);
            try {
                const allAnswers = [...answers, currentAnswer];
                const response = await axios.post('http://localhost:5226/api/ChatBot/recommend', allAnswers);
                setRecommendation(response.data);
            } catch (error) {
                console.error('Error getting recommendations:', error);
                setError('Sorry, there was an error getting your recommendations. Please try again.');
            }
            setIsLoading(false);
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSubmit();
        }
    };

    return (
        <div className="max-w-2xl mx-auto">
            <div className="bg-white rounded-lg p-6">
                {currentQuestion < questions.length ? (
                    <div>
                        <p className="mb-4 text-lg">{questions[currentQuestion]}</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                onKeyPress={handleKeyPress}
                                className="flex-1 p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Type your answer..."
                            />
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                            >
                                {currentQuestion < questions.length - 1 ? 'Next' : 'Get Recommendations'}
                            </button>
                        </div>
                        {error && (
                            <p className="mt-2 text-red-500 text-sm">{error}</p>
                        )}
                    </div>
                ) : (
                    <div>
                        {isLoading ? (
                            <div className="flex items-center justify-center p-4">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                <span className="ml-2">Getting your recommendations...</span>
                            </div>
                        ) : (
                            <div>
                                <h3 className="text-xl font-semibold mb-4">Your Recommendations:</h3>
                                <div className="whitespace-pre-wrap bg-gray-50 p-4 rounded-lg">
                                    {recommendation}
                                </div>
                                <button
                                    onClick={() => {
                                        setCurrentQuestion(0);
                                        setAnswers([]);
                                        setCurrentAnswer('');
                                        setRecommendation('');
                                        setError(null);
                                    }}
                                    className="mt-4 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
                                >
                                    Start Over
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarChatBot; 