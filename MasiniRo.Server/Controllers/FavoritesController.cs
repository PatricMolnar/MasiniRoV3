using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MasiniRo.Server.Data;
using MasiniRo.Server.Models;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class FavoritesController : ControllerBase
    {
        private readonly AppDbContext _context;

        public FavoritesController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/Favorites/user/{userId} - Get user's favorite listings
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserFavorites(int userId)
        {
            try
            {
                var favorites = await _context.Favorites
                    .Include(f => f.CarListing)
                    .ThenInclude(c => c.User)
                    .Where(f => f.UserId == userId)
                    .Select(f => new
                    {
                        FavoriteId = f.Id,
                        Car = new
                        {
                            f.CarListing.Id,
                            f.CarListing.Title,
                            f.CarListing.Brand,
                            f.CarListing.Model,
                            f.CarListing.Price,
                            f.CarListing.Year,
                            f.CarListing.Description,
                            f.CarListing.ImageUrl,
                            f.CarListing.CreatedAt,
                            f.CarListing.UserId,
                            SellerName = f.CarListing.User.FirstName + " " + f.CarListing.User.LastName,
                            SellerPhone = f.CarListing.User.PhoneNumber
                        },
                        SavedAt = f.SavedAt
                    })
                    .OrderByDescending(f => f.SavedAt)
                    .ToListAsync();

                return Ok(favorites);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to get favorites: {ex.Message}" });
            }
        }

        // POST: api/Favorites - Add a car to favorites
        [HttpPost]
        public async Task<ActionResult> AddToFavorites([FromBody] AddFavoriteDto favoriteDto)
        {
            try
            {
                // Check if user exists
                var user = await _context.AppUsers.FindAsync(favoriteDto.UserId);
                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Check if car listing exists
                var carListing = await _context.CarListings.FindAsync(favoriteDto.CarListingId);
                if (carListing == null)
                {
                    return NotFound(new { message = "Car listing not found." });
                }

                // PREVENT SELF-FAVORITING: Check if user is trying to favorite their own listing
                if (carListing.UserId == favoriteDto.UserId)
                {
                    return BadRequest(new { message = "You cannot favorite your own listings. Check 'My Listings' to manage your cars." });
                }

                // Check if already favorited
                var existingFavorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserId == favoriteDto.UserId && f.CarListingId == favoriteDto.CarListingId);

                if (existingFavorite != null)
                {
                    return BadRequest(new { message = "This car is already in your favorites." });
                }

                // Create new favorite
                var favorite = new Favorite
                {
                    UserId = favoriteDto.UserId,
                    CarListingId = favoriteDto.CarListingId,
                    SavedAt = DateTime.Now
                };

                _context.Favorites.Add(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Car added to favorites successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to add to favorites: {ex.Message}" });
            }
        }

        // DELETE: api/Favorites - Remove a car from favorites
        [HttpDelete]
        public async Task<ActionResult> RemoveFromFavorites([FromQuery] int userId, [FromQuery] int carListingId)
        {
            try
            {
                var favorite = await _context.Favorites
                    .FirstOrDefaultAsync(f => f.UserId == userId && f.CarListingId == carListingId);

                if (favorite == null)
                {
                    return NotFound(new { message = "Favorite not found." });
                }

                _context.Favorites.Remove(favorite);
                await _context.SaveChangesAsync();

                return Ok(new { message = "Car removed from favorites successfully!" });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to remove from favorites: {ex.Message}" });
            }
        }

        // GET: api/Favorites/check - Check if a car is favorited by user
        [HttpGet("check")]
        public async Task<ActionResult<bool>> CheckIfFavorited([FromQuery] int userId, [FromQuery] int carListingId)
        {
            try
            {
                var isFavorited = await _context.Favorites
                    .AnyAsync(f => f.UserId == userId && f.CarListingId == carListingId);

                return Ok(new { isFavorited = isFavorited });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to check favorite status: {ex.Message}" });
            }
        }

        // GET: api/Favorites/count/user/{userId} - Get user's total favorites count
        [HttpGet("count/user/{userId}")]
        public async Task<ActionResult<int>> GetUserFavoritesCount(int userId)
        {
            try
            {
                var count = await _context.Favorites
                    .CountAsync(f => f.UserId == userId);

                return Ok(new { count = count });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to get favorites count: {ex.Message}" });
            }
        }
    }

    // DTO for adding favorites
    public class AddFavoriteDto
    {
        public int UserId { get; set; }
        public int CarListingId { get; set; }
    }
}