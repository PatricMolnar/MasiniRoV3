import React, { useState, useEffect } from "react";
import "../styles/CarMarketplace.css";

const SearchBar = ({ onSearchChange, totalResults, isSearching }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: "",
    maxPrice: "",
    minYear: "",
    maxYear: "",
    brand: "",
    sortBy: "newest", // newest, oldest, priceLow, priceHigh
  });

  // Real-time search as user types
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      onSearchChange(searchTerm, filters);
    }, 300); // 300ms delay to avoid too many API calls

    return () => clearTimeout(delayedSearch);
  }, [searchTerm, filters, onSearchChange]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (filterName, value) => {
    setFilters((prev) => ({
      ...prev,
      [filterName]: value,
    }));
  };

  const clearSearch = () => {
    setSearchTerm("");
    setFilters({
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      brand: "",
      sortBy: "newest",
    });
  };

  const clearFilters = () => {
    setFilters({
      minPrice: "",
      maxPrice: "",
      minYear: "",
      maxYear: "",
      brand: "",
      sortBy: "newest",
    });
  };

  const applyFilters = () => {
    setShowFiltersModal(false);
    // Filters are already applied via useEffect
  };

  const currentYear = new Date().getFullYear();
  const hasActiveFilters =
    filters.minPrice ||
    filters.maxPrice ||
    filters.minYear ||
    filters.maxYear ||
    filters.brand ||
    filters.sortBy !== "newest";

  return (
    <div className="search-container">
      {/* Large Search Bar */}
      <div className="large-search-wrapper">
        <div className="large-search-input-container">
          <div className="search-icon-large">🔍</div>
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder="Search for cars by title, brand, model, description..."
            className="large-search-input"
          />
          {searchTerm && (
            <button className="clear-search-btn-large" onClick={clearSearch}>
              ×
            </button>
          )}
        </div>

        <button
          className={`filter-btn-large ${hasActiveFilters ? "active" : ""}`}
          onClick={() => setShowFiltersModal(true)}
        >
          🔧 Filters
          {hasActiveFilters && <span className="filter-indicator">•</span>}
        </button>
      </div>

      {/* Search Results Summary */}
      {(searchTerm || hasActiveFilters) && (
        <div className="search-results-summary">
          {isSearching ? (
            <span className="searching-text">🔄 Searching...</span>
          ) : (
            <span className="results-count">
              {totalResults} {totalResults === 1 ? "car" : "cars"} found
              {searchTerm && (
                <span className="search-term"> for "{searchTerm}"</span>
              )}
            </span>
          )}
          {(searchTerm || hasActiveFilters) && (
            <button className="clear-all-btn" onClick={clearSearch}>
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Filters Modal */}
      {showFiltersModal && (
        <div
          className="filters-modal-overlay"
          onClick={() => setShowFiltersModal(false)}
        >
          <div
            className="filters-modal-content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="filters-modal-header">
              <h2>🔧 Filter Cars</h2>
              <button
                className="close-modal-btn"
                onClick={() => setShowFiltersModal(false)}
              >
                ×
              </button>
            </div>

            <div className="filters-modal-body">
              <div className="filters-grid-modal">
                {/* Price Range */}
                <div className="filter-group-modal">
                  <label>💰 Price Range</label>
                  <div className="price-inputs">
                    <input
                      type="number"
                      placeholder="Min $"
                      value={filters.minPrice}
                      onChange={(e) =>
                        handleFilterChange("minPrice", e.target.value)
                      }
                      min="0"
                    />
                    <span className="range-separator">to</span>
                    <input
                      type="number"
                      placeholder="Max $"
                      value={filters.maxPrice}
                      onChange={(e) =>
                        handleFilterChange("maxPrice", e.target.value)
                      }
                      min="0"
                    />
                  </div>
                </div>

                {/* Year Range */}
                <div className="filter-group-modal">
                  <label>📅 Year Range</label>
                  <div className="year-inputs">
                    <input
                      type="number"
                      placeholder="Min Year"
                      value={filters.minYear}
                      onChange={(e) =>
                        handleFilterChange("minYear", e.target.value)
                      }
                      min="1900"
                      max={currentYear}
                    />
                    <span className="range-separator">to</span>
                    <input
                      type="number"
                      placeholder="Max Year"
                      value={filters.maxYear}
                      onChange={(e) =>
                        handleFilterChange("maxYear", e.target.value)
                      }
                      min="1900"
                      max={currentYear}
                    />
                  </div>
                </div>

                {/* Brand Filter */}
                <div className="filter-group-modal">
                  <label>🚗 Brand</label>
                  <select
                    value={filters.brand}
                    onChange={(e) =>
                      handleFilterChange("brand", e.target.value)
                    }
                    className="brand-select-modal"
                  >
                    <option value="">All Brands</option>
                    <option value="audi">Audi</option>
                    <option value="bmw">BMW</option>
                    <option value="mercedes">Mercedes-Benz</option>
                    <option value="volkswagen">Volkswagen</option>
                    <option value="toyota">Toyota</option>
                    <option value="honda">Honda</option>
                    <option value="ford">Ford</option>
                    <option value="chevrolet">Chevrolet</option>
                    <option value="nissan">Nissan</option>
                    <option value="hyundai">Hyundai</option>
                    <option value="kia">Kia</option>
                    <option value="mazda">Mazda</option>
                    <option value="subaru">Subaru</option>
                    <option value="lexus">Lexus</option>
                    <option value="infiniti">Infiniti</option>
                    <option value="acura">Acura</option>
                    <option value="volvo">Volvo</option>
                    <option value="porsche">Porsche</option>
                    <option value="jaguar">Jaguar</option>
                    <option value="land rover">Land Rover</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                {/* Sort By */}
                <div className="filter-group-modal">
                  <label>📊 Sort By</label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) =>
                      handleFilterChange("sortBy", e.target.value)
                    }
                    className="sort-select-modal"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="priceLow">Price: Low to High</option>
                    <option value="priceHigh">Price: High to Low</option>
                    <option value="yearNew">Year: Newest First</option>
                    <option value="yearOld">Year: Oldest First</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="filters-modal-footer">
              {hasActiveFilters && (
                <button
                  className="clear-filters-btn-modal"
                  onClick={clearFilters}
                >
                  Clear All Filters
                </button>
              )}
              <div className="modal-action-buttons">
                <button
                  className="cancel-btn-modal"
                  onClick={() => setShowFiltersModal(false)}
                >
                  Cancel
                </button>
                <button className="apply-btn-modal" onClick={applyFilters}>
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SearchBar;
