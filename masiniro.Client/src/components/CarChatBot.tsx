import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import CarCard from './CarCard.jsx';

const questions = [
    "What is your preferred car type? (e.g., SUV, Sedan, Sports car)",
    "What is your budget range?",
    "What features are most important to you? (e.g., fuel efficiency, safety, performance)",
    "How do you plan to use the car? (e.g., daily commute, family trips, weekend drives)",
    "What is your preferred brand or any specific brands you prefer to avoid?"
];

interface Car {
    id: number;
    title: string;
    brand: string;
    model: string;
    price: number;
    year: number;
    description: string;
    imageUrl: string;
    createdAt: string;
    userId: number;
}

interface CarChatBotProps {
    filteredCars: Car[];
}

const CarChatBot: React.FC<CarChatBotProps> = ({ filteredCars }) => {
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [recommendedCars, setRecommendedCars] = useState<Car[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showCarCards, setShowCarCards] = useState(false);

    const extractCarIds = (text: string): number[] => {
        const carIdRegex = /Car ID: (\d+)/g;
        const matches = [...text.matchAll(carIdRegex)];
        return matches.map(match => parseInt(match[1]));
    };

    const fetchCarsByIds = async (carIds: number[]): Promise<Car[]> => {
        try {
            const cars: Car[] = [];
            for (const id of carIds) {
                const response = await fetch(`/api/CarListings/${id}`);
                if (response.ok) {
                    const car = await response.json();
                    cars.push(car);
                }
            }
            return cars;
        } catch (error) {
            console.error('Error fetching cars by IDs:', error);
            return [];
        }
    };

    const handleSubmit = async () => {
        if (currentQuestion < questions.length - 1) {
            setAnswers([...answers, currentAnswer]);
            setCurrentAnswer('');
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setIsLoading(true);
            setShowCarCards(false);
            try {
                const allAnswers = [...answers, currentAnswer];
                const response = await axios.post('api/ChatBot/recommend', allAnswers);
                const geminiResponseText = response.data;
                
                // Extract car IDs before cleaning the text
                const carIds = extractCarIds(geminiResponseText);
                
                // Clean up the recommendation text
                const cleanRecommendationText = geminiResponseText
                    // Remove car IDs and their associated lines
                    .replace(/Car ID: \d+.*(?:\n|$)/g, '')
                    // Remove any remaining car ID references
                    .replace(/\[Car ID: \d+\]/g, '')
                    .replace(/\(Car ID: \d+\)/g, '')
                    // Remove other formatting
                    .replace(/\*/g, '')
                    .replace(/#/g, '')
                    .replace(/_/g, '')
                    // Clean up whitespace
                    .replace(/\n{3,}/g, '\n\n')
                    .replace(/^\s+|\s+$/g, '')
                    .split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0 && !line.includes('Car ID:'))
                    .join('\n');

                setRecommendation(cleanRecommendationText);

                if (carIds.length > 0) {
                    // Fetch cars by their IDs
                    const cars = await fetchCarsByIds(carIds);
                    setRecommendedCars(cars);
                } else {
                    console.warn('No car IDs found in the recommendation');
                    setRecommendation(prev => prev + '\n\nNote: We couldn\'t find any specific car recommendations. Please try adjusting your preferences or browse our full inventory.');
                    setRecommendedCars([]);
                }
                
                setCurrentQuestion(currentQuestion + 1);
                setShowCarCards(true);
            } catch (error) {
                console.error('Error getting recommendations:', error);
                setRecommendation('Sorry, there was an error getting your recommendations. Please try again.');
                setRecommendedCars([]);
                setCurrentQuestion(currentQuestion + 1);
            } finally {
                setIsLoading(false);
            }
        }
    };

    return (
        <div className="chatbot-container">
            <div className="chatbot-content">
                <div className="chatbot-header">
                    <h2>Car Recommendation Assistant</h2>
                    <p className="chatbot-subtitle">Let's find your perfect car match</p>
                </div>

                {currentQuestion < questions.length ? (
                    <div className="chatbot-question-section">
                        <div className="question-progress">
                            <div className="progress-bar">
                                <div 
                                    className="progress-fill"
                                    style={{ width: `${((currentQuestion + 1) / questions.length) * 100}%` }}
                                />
                            </div>
                            <span className="progress-text">Question {currentQuestion + 1} of {questions.length}</span>
                        </div>

                        <div className="question-container">
                            <p className="question-text">{questions[currentQuestion]}</p>
                            <div className="answer-input-container">
                                <input
                                    type="text"
                                    value={currentAnswer}
                                    onChange={(e) => setCurrentAnswer(e.target.value)}
                                    className="answer-input"
                                    placeholder="Type your answer..."
                                    onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
                                />
                                <button
                                    onClick={handleSubmit}
                                    className="submit-button"
                                    disabled={!currentAnswer.trim()}
                                >
                                    {currentQuestion < questions.length - 1 ? 'Next' : 'Get Recommendations'}
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="recommendation-section">
                        {isLoading ? (
                            <div className="loading-container">
                                <div className="loading-spinner"></div>
                                <p>Getting your personalized recommendations...</p>
                            </div>
                        ) : (
                            <>
                                <div className="ai-recommendation-section">
                                    <h3>AI Recommendations</h3>
                                    <div className="recommendation-text">{recommendation}</div>
                                </div>

                                {showCarCards && recommendedCars.length > 0 && (
                                    <div className="matching-cars-section">
                                        <h3>Recommended Cars</h3>
                                        <div className="car-grid">
                                            {recommendedCars.map((car) => (
                                                <CarCard
                                                    key={car.id}
                                                    id={car.id}
                                                    imageUrl={car.imageUrl}
                                                    title={car.title}
                                                    price={car.price}
                                                    mileage={0}
                                                    userId={car.userId}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setCurrentQuestion(0);
                                        setAnswers([]);
                                        setCurrentAnswer('');
                                        setRecommendation('');
                                        setRecommendedCars([]);
                                        setShowCarCards(false);
                                    }}
                                    className="restart-button"
                                >
                                    Start New Search
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CarChatBot; 