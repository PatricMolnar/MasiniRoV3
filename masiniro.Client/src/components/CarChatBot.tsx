import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom'; // Assuming you are using React Router

const questions = [
    "What is your preferred car type? (e.g., SUV, Sedan, Sports car)",
    "What is your budget range?",
    "What features are most important to you? (e.g., fuel efficiency, safety, performance)",
    "How do you plan to use the car? (e.g., daily commute, family trips, weekend drives)",
    "What is your preferred brand or any specific brands you prefer to avoid?"
];

interface Car { // Define a type for car objects
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
    filteredCars: Car[]; // Add prop for filtered cars
}

const CarChatBot: React.FC<CarChatBotProps> = ({ filteredCars }) => { // Accept filteredCars as a prop
    const [currentQuestion, setCurrentQuestion] = useState(0);
    const [answers, setAnswers] = useState<string[]>([]);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [recommendation, setRecommendation] = useState('');
    const [recommendedCarId, setRecommendedCarId] = useState<number | null>(null); // State for recommended car ID
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (currentQuestion < questions.length - 1) {
            setAnswers([...answers, currentAnswer]);
            setCurrentAnswer('');
            setCurrentQuestion(currentQuestion + 1);
        } else {
            setIsLoading(true);
            try {
                const allAnswers = [...answers, currentAnswer];
                const response = await axios.post('api/ChatBot/recommend', allAnswers);
                const geminiResponseText = response.data;
                setRecommendation(geminiResponseText);
                console.log("Recommendation received:", geminiResponseText);

                // Attempt to parse car details from Gemini's response
                const carDetails = parseCarDetailsFromRecommendation(geminiResponseText);

                if (carDetails) {
                     // Find the recommended car in the filteredCars list
                    const foundCar = filteredCars.find(car =>
                         car.brand.toLowerCase() === carDetails.brand.toLowerCase() &&
                         car.model.toLowerCase() === carDetails.model.toLowerCase()
                    );

                    if (foundCar) {
                        setRecommendedCarId(foundCar.id);
                        console.log("Matched recommended car ID:", foundCar.id);
                    } else {
                         setRecommendedCarId(null);
                         console.log("Could not match recommended car to a listing.");
                    }
                }

                setCurrentQuestion(currentQuestion + 1);

            } catch (error) {
                console.error('Error getting recommendations:', error);
                setRecommendation('Sorry, there was an error getting your recommendations. Please try again.');
                setRecommendedCarId(null);
                setCurrentQuestion(currentQuestion + 1);
            }
            setIsLoading(false);
        }
    };

    // Helper function to parse car details from the recommendation text
    const parseCarDetailsFromRecommendation = (text: string) => {
        const idMatch = text.match(/ID:\s*(\d+)/i); // Look for "ID: " followed by digits
        const brandMatch = text.match(/Brand:\s*([^,\n]+)/i);
        const modelMatch = text.match(/Model:\s*([^,\n]+)/i);
        // const yearMatch = text.match(/\b(\d{4})\b/);

        // We prioritize finding the ID now
        if (idMatch) {
            const carId = parseInt(idMatch[1]);
            // Optionally, still try to get other details if needed for display before matching
             const brand = brandMatch ? brandMatch[1].trim() : 'Unknown Brand';
             const model = modelMatch ? modelMatch[1].trim() : 'Unknown Model';

            return {
                id: carId,
                brand: brand,
                model: model,
                year: null // We are not using year for matching anymore
            };
        }

        // Fallback to old parsing if ID is not found (less reliable)
        if (brandMatch && modelMatch) {
            console.warn("Car ID not found in Gemini response, falling back to parsing brand/model.");
            return {
                id: null, // Indicate that ID was not explicitly found
                brand: brandMatch[1].trim(),
                model: modelMatch[1].trim(),
                year: null // Year parsing removed as it's less reliable without ID
            };
        }

        return null; // Return null if no details are found
    };

    // Find the recommended car object based on recommendedCarId
    const recommendedCar = recommendedCarId !== null
    ? filteredCars.find(car => car.id === recommendedCarId)
    : null;

    return (
        <div className="max-w-2xl mx-auto p-4">
            <div className="bg-white rounded-lg shadow-lg p-6">
                <h2 className="text-2xl font-bold mb-4">Car Recommendation Chat</h2>
                
                {currentQuestion < questions.length ? (
                    <div>
                        <p className="mb-4">{questions[currentQuestion]}</p>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={currentAnswer}
                                onChange={(e) => setCurrentAnswer(e.target.value)}
                                className="flex-1 p-2 border rounded"
                                placeholder="Type your answer..."
                            />
                            <button
                                onClick={handleSubmit}
                                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                            >
                                {currentQuestion < questions.length - 1 ? 'Next' : 'Get Recommendations'}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div>
                        {isLoading ? (
                            <p>Getting your recommendations...</p>
                        ) : (
                            <div>
                                <h3 className="text-xl font-semibold mb-2">Your Recommendations:</h3>
                                <div className="whitespace-pre-wrap">{recommendation}</div>

                                {/* Display recommended car image and details if found */}
                                {recommendedCar && (
                                    <div className="recommended-car-display mt-4 p-4 border rounded-lg">
                                        <h4 className="text-lg font-semibold mb-2">Recommended Car:</h4>
                                        <img src={recommendedCar.imageUrl?.split(',')[0]} alt={`${recommendedCar.brand} ${recommendedCar.model}`} className="w-full h-48 object-cover rounded-md mb-2" />
                                        <p className="font-semibold">{recommendedCar.title}</p>
                                        <p>${recommendedCar.price?.toLocaleString()}</p>
                                        <Link to={`/car/${recommendedCar.id}`} className="text-blue-500 hover:underline">View Details</Link>
                                    </div>
                                )}

                                <button
                                    onClick={() => {
                                        setCurrentQuestion(0);
                                        setAnswers([]);
                                        setCurrentAnswer('');
                                        setRecommendation('');
                                        setRecommendedCarId(null);
                                    }}
                                    className="mt-4 ml-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
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