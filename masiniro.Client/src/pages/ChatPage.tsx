import React, { useEffect, useState } from 'react';
import CarChatBot from '../components/CarChatBot';
import Header from '../components/Header';
import Footer from '../components/Footer';

interface Car { // Define a type for car objects, matching the interface in CarChatBot.tsx
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

const ChatPage: React.FC = () => {
    const [allCars, setAllCars] = useState<Car[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchCars = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await fetch("/api/CarListings");
                if (!response.ok) {
                    throw new Error("Failed to fetch cars");
                }
                const data: Car[] = await response.json();
                setAllCars(data);
            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchCars();
    }, []);

    if (loading) {
        return <div className="loading">Loading cars for the chatbot...</div>;
    }

    if (error) {
        return <div className="error">Error loading cars: {error}</div>;
    }

    return (
        <div>
            <Header />
            <div className="container">

                {/* Pass all fetched cars to the CarChatBot */}
                <CarChatBot filteredCars={allCars} />
            </div>
            <Footer />
        </div>
    );
};

export default ChatPage; 