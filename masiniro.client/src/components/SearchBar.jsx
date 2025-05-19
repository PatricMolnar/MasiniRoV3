import React from 'react';
import '../styles/CarMarketplace.css';

const SearchBar = () => (
    <div className="search-bar">
        <input type="text" placeholder="Search for cars..." />
        <button>Search</button>
    </div>
);

export default SearchBar;
