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

    const parseCarDetailsFromRecommendation = (text: string) => {
        // Split the text into sections for each car recommendation
        const carSections = text.split(/\n\s*\n/);
        
        return carSections.map(section => {
            // Remove any car ID references from the section
            const cleanSection = section.replace(/Car ID: \d+/g, '').trim();
            
            // Look for car details in the format:
            // Brand: [brand]
            // Model: [model]
            // Year: [year] (optional)
            // Price: [price] (optional)
            const brandMatch = cleanSection.match(/Brand:\s*([^,\n]+)/i);
            const modelMatch = cleanSection.match(/Model:\s*([^,\n]+)/i);
            const yearMatch = cleanSection.match(/Year:\s*(\d{4})/i);
            const priceMatch = cleanSection.match(/Price:\s*\$?(\d+(?:,\d+)*)/i);

            if (brandMatch && modelMatch) {
                const brand = brandMatch[1].trim();
                const model = modelMatch[1].trim();
                const year = yearMatch ? parseInt(yearMatch[1]) : null;
                const price = priceMatch ? parseInt(priceMatch[1].replace(/,/g, '')) : null;

                // Find matching cars in our inventory
                const matchingCars = filteredCars.filter(car => {
                    const brandMatch = car.brand.toLowerCase().includes(brand.toLowerCase());
                    const modelMatch = car.model.toLowerCase().includes(model.toLowerCase());
                    const yearMatch = !year || car.year === year;
                    const priceMatch = !price || Math.abs(car.price - price) <= 5000; // Allow $5000 price difference

                    return brandMatch && modelMatch && yearMatch && priceMatch;
                });

                if (matchingCars.length > 0) {
                    // Return the best match (closest price if price was specified)
                    if (price) {
                        return matchingCars.reduce((best, current) => {
                            const bestDiff = Math.abs(best.price - price);
                            const currentDiff = Math.abs(current.price - price);
                            return currentDiff < bestDiff ? current : best;
                        });
                    }
                    return matchingCars[0];
                }
            }
            return null;
        }).filter((car): car is Car => car !== null);
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
                
                // Clean up the recommendation text
                const cleanRecommendationText = geminiResponseText
                    .replace(/Car ID: \d+/g, '') // Remove car IDs
                    .replace(/\*/g, '') // Remove asterisks
                    .replace(/#/g, '') // Remove hash symbols
                    .replace(/_/g, '') // Remove underscores
                    .replace(/\n{3,}/g, '\n\n') // Replace multiple newlines with double newlines
                    .replace(/^\s+|\s+$/g, '') // Trim whitespace
                    .split('\n') // Split into lines
                    .map(line => line.trim()) // Trim each line
                    .filter(line => line.length > 0) // Remove empty lines
                    .join('\n'); // Join back with newlines

                setRecommendation(cleanRecommendationText);

                // Get matching cars directly from the parsed recommendations
                const matchingCars = parseCarDetailsFromRecommendation(cleanRecommendationText);
                setRecommendedCars(matchingCars);
                setCurrentQuestion(currentQuestion + 1);
                
                // Show car cards after a short delay
                setTimeout(() => {
                    setShowCarCards(true);
                }, 1000);
            } catch (error) {
                console.error('Error getting recommendations:', error);
                setRecommendation('Sorry, there was an error getting your recommendations. Please try again.');
                setRecommendedCars([]);
                setCurrentQuestion(currentQuestion + 1);
            }
            setIsLoading(false);
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
                                        <h3>Matching Cars in Our Inventory</h3>
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