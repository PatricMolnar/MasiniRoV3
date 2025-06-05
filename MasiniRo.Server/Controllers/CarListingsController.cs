using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MasiniRo.Server.Data;
using MasiniRo.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CarListingsController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public CarListingsController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/CarListings - Get all car listings
        [HttpGet]
        public async Task<ActionResult<IEnumerable<object>>> GetCarListings()
        {
            var carListings = await _context.CarListings
                .Include(c => c.User)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Brand,
                    c.Model,
                    c.Price,
                    c.Year,
                    c.Mileage,
                    c.Description,
                    c.ImageUrl,
                    c.CreatedAt,
                    c.UserId,
                    SellerName = c.User.FirstName + " " + c.User.LastName,
                    SellerPhone = c.User.PhoneNumber
                })
                .ToListAsync();

            return Ok(carListings);
        }

        // GET: api/CarListings/5 - Get single car listing
        [HttpGet("{id}")]
        public async Task<ActionResult<object>> GetCarListing(int id)
        {
            var carListing = await _context.CarListings
                .Include(c => c.User)
                .Where(c => c.Id == id)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Brand,
                    c.Model,
                    c.Price,
                    c.Year,
                    c.Mileage,
                    c.Description,
                    c.ImageUrl,
                    c.CreatedAt,
                    c.UserId,
                    SellerName = c.User.FirstName + " " + c.User.LastName,
                    SellerPhone = c.User.PhoneNumber,
                    SellerEmail = c.User.Email
                })
                .FirstOrDefaultAsync();

            if (carListing == null)
            {
                return NotFound();
            }

            return Ok(carListing);
        }

        // GET: api/CarListings/user/{userId} - Get user's car listings
        [HttpGet("user/{userId}")]
        public async Task<ActionResult<IEnumerable<object>>> GetUserCarListings(int userId)
        {
            var userCarListings = await _context.CarListings
                .Where(c => c.UserId == userId)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Brand,
                    c.Model,
                    c.Price,
                    c.Year,
                    c.Mileage,
                    c.Description,
                    c.ImageUrl,
                    c.CreatedAt,
                    c.UserId
                })
                .ToListAsync();

            return Ok(userCarListings);
        }

        // POST: api/CarListings - Create new car listing with multiple images
        [HttpPost]
        public async Task<ActionResult<CarListing>> PostCarListing([FromForm] CarListingCreateDto carListingDto)
        {
            try
            {
                // Validate basic car data
                var validationResult = ValidateCarListingData(carListingDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                // Handle images
                List<string> imagePaths = new List<string>();
                
                if (carListingDto.Images != null && carListingDto.Images.Any())
                {
                    // Validate each image
                    foreach (var image in carListingDto.Images)
                    {
                        var imageValidation = ValidateCarImage(image);
                        if (!imageValidation.IsValid)
                        {
                            return BadRequest(new { message = imageValidation.ErrorMessage });
                        }
                    }

                    // Save all images
                    for (int i = 0; i < carListingDto.Images.Count; i++)
                    {
                        var imagePath = await SaveCarImage(carListingDto.Images[i], carListingDto.UserId, i);
                        imagePaths.Add(imagePath);
                    }
                }

                // Create car listing
                var carListing = new CarListing
                {
                    Title = carListingDto.Title,
                    Brand = carListingDto.Brand,
                    Model = carListingDto.Model,
                    Price = carListingDto.Price,
                    Year = carListingDto.Year,
                    Mileage = carListingDto.Mileage,
                    Description = carListingDto.Description,
                    ImageUrl = System.Text.Json.JsonSerializer.Serialize(imagePaths),
                    UserId = carListingDto.UserId,
                    CreatedAt = DateTime.Now
                };

                _context.CarListings.Add(carListing);
                await _context.SaveChangesAsync();

                return CreatedAtAction(nameof(GetCarListing), new { id = carListing.Id }, carListing);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Failed to create car listing: {ex.Message}" });
            }
        }

        // PUT: api/CarListings/5 - Update car listing (COMPLETE EDIT SUPPORT)
        [HttpPut("{id}")]
        public async Task<IActionResult> PutCarListing(int id, [FromForm] CarListingUpdateDto carListingDto)
        {
            try
            {
                var carListing = await _context.CarListings.FindAsync(id);
                
                if (carListing == null)
                {
                    return NotFound(new { message = "Car listing not found." });
                }

                // Check ownership
                if (carListing.UserId != carListingDto.UserId)
                {
                    return BadRequest(new { message = "You can only edit your own listings." });
                }

                // Validate the updated data
                var validationResult = ValidateCarListingUpdateData(carListingDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                // Update basic fields
                carListing.Title = carListingDto.Title;
                carListing.Brand = carListingDto.Brand;
                carListing.Model = carListingDto.Model;
                carListing.Price = carListingDto.Price;
                carListing.Year = carListingDto.Year;
                carListing.Mileage = carListingDto.Mileage;
                carListing.Description = carListingDto.Description;

                // Handle image updates
                await HandleImageUpdates(carListing, carListingDto);

                await _context.SaveChangesAsync();
                
                return Ok(new { message = "Car listing updated successfully!" });
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error updating car listing: {ex.Message}");
                return StatusCode(500, new { message = $"Failed to update car listing: {ex.Message}" });
            }
        }

        // DELETE: api/CarListings/5 - Delete car listing
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCarListing(int id, [FromQuery] int userId)
        {
            var carListing = await _context.CarListings.FindAsync(id);
            if (carListing == null)
            {
                return NotFound();
            }

            // Check ownership
            if (carListing.UserId != userId)
            {
                return BadRequest(new { message = "You can only delete your own listings." });
            }

            // Delete associated images
            try
            {
                var imagePaths = System.Text.Json.JsonSerializer.Deserialize<List<string>>(carListing.ImageUrl ?? "[]");
                foreach (var imagePath in imagePaths)
                {
                    DeleteFile(imagePath);
                }
            }
            catch
            {
                // Continue even if image deletion fails
            }

            _context.CarListings.Remove(carListing);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // Helper method to check if car exists
        private bool CarListingExists(int id)
        {
            return _context.CarListings.Any(e => e.Id == id);
        }

        // COMPLETE IMAGE UPDATE HANDLING
        private async Task HandleImageUpdates(CarListing carListing, CarListingUpdateDto carListingDto)
        {
            // Get current images
            List<string> currentImages = new List<string>();
            try
            {
                currentImages = System.Text.Json.JsonSerializer.Deserialize<List<string>>(carListing.ImageUrl ?? "[]") ?? new List<string>();
            }
            catch
            {
                currentImages = new List<string>();
            }

            List<string> finalImages = new List<string>();

            // Handle keeping existing images
            if (!string.IsNullOrWhiteSpace(carListingDto.KeepExistingImages))
            {
                try
                {
                    var imagesToKeep = System.Text.Json.JsonSerializer.Deserialize<List<string>>(carListingDto.KeepExistingImages);
                    if (imagesToKeep != null)
                    {
                        // Only keep images that actually exist in current images
                        finalImages.AddRange(imagesToKeep.Where(img => currentImages.Contains(img)));
                        
                        // Delete images that are being removed
                        var imagesToDelete = currentImages.Except(imagesToKeep).ToList();
                        foreach (var imageToDelete in imagesToDelete)
                        {
                            DeleteFile(imageToDelete);
                        }
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"Error processing kept images: {ex.Message}");
                    // If there's an error parsing, keep all current images
                    finalImages.AddRange(currentImages);
                }
            }
            // If new images are being uploaded, replace all images
            else if (carListingDto.Images != null && carListingDto.Images.Any())
            {
                // Delete all old images
                foreach (var oldImage in currentImages)
                {
                    DeleteFile(oldImage);
                }
                finalImages.Clear();
            }
            // If no changes specified, keep existing images
            else
            {
                finalImages.AddRange(currentImages);
            }

            // Add new images if provided
            if (carListingDto.Images != null && carListingDto.Images.Any())
            {
                // Validate new images
                foreach (var image in carListingDto.Images)
                {
                    var imageValidation = ValidateCarImage(image);
                    if (!imageValidation.IsValid)
                    {
                        throw new Exception(imageValidation.ErrorMessage);
                    }
                }

                // Check total image count
                if (finalImages.Count + carListingDto.Images.Count > 6)
                {
                    throw new Exception("Total images cannot exceed 6. Please remove some existing images first.");
                }

                // Save new images
                for (int i = 0; i < carListingDto.Images.Count; i++)
                {
                    var imagePath = await SaveCarImage(carListingDto.Images[i], carListingDto.UserId, finalImages.Count + i);
                    finalImages.Add(imagePath);
                }
            }

            // Ensure we have at least one image
            if (!finalImages.Any())
            {
                throw new Exception("At least one image is required for the car listing.");
            }

            // Update the car listing with final images
            carListing.ImageUrl = System.Text.Json.JsonSerializer.Serialize(finalImages);
        }

        // VALIDATION METHODS
        private SimpleValidationResult ValidateCarListingData(CarListingCreateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Length < 5)
                return new SimpleValidationResult(false, "Title must be at least 5 characters long.");

            if (dto.Title.Length > 100)
                return new SimpleValidationResult(false, "Title cannot exceed 100 characters.");

            if (string.IsNullOrWhiteSpace(dto.Brand))
                return new SimpleValidationResult(false, "Brand is required.");

            if (string.IsNullOrWhiteSpace(dto.Model))
                return new SimpleValidationResult(false, "Model is required.");

            if (dto.Price <= 0)
                return new SimpleValidationResult(false, "Price must be greater than 0.");

            if (dto.Year < 1900 || dto.Year > DateTime.Now.Year + 1)
                return new SimpleValidationResult(false, $"Year must be between 1900 and {DateTime.Now.Year + 1}.");

            if (dto.Mileage < 0)
                return new SimpleValidationResult(false, "Mileage cannot be negative.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                return new SimpleValidationResult(false, "Description is required.");

            if (dto.Images != null && dto.Images.Count > 6)
                return new SimpleValidationResult(false, "You can upload maximum 6 images.");

            return new SimpleValidationResult(true, null);
        }

        private SimpleValidationResult ValidateCarListingUpdateData(CarListingUpdateDto dto)
        {
            if (string.IsNullOrWhiteSpace(dto.Title) || dto.Title.Length < 5)
                return new SimpleValidationResult(false, "Title must be at least 5 characters long.");

            if (dto.Title.Length > 100)
                return new SimpleValidationResult(false, "Title cannot exceed 100 characters.");

            if (string.IsNullOrWhiteSpace(dto.Brand))
                return new SimpleValidationResult(false, "Brand is required.");

            if (string.IsNullOrWhiteSpace(dto.Model))
                return new SimpleValidationResult(false, "Model is required.");

            if (dto.Price <= 0)
                return new SimpleValidationResult(false, "Price must be greater than 0.");

            if (dto.Year < 1900 || dto.Year > DateTime.Now.Year + 1)
                return new SimpleValidationResult(false, $"Year must be between 1900 and {DateTime.Now.Year + 1}.");

            if (dto.Mileage < 0)
                return new SimpleValidationResult(false, "Mileage cannot be negative.");

            if (string.IsNullOrWhiteSpace(dto.Description))
                return new SimpleValidationResult(false, "Description is required.");

            return new SimpleValidationResult(true, null);
        }

        private SimpleValidationResult ValidateCarImage(IFormFile file)
        {
            // Check file size (10MB max)
            if (file.Length > 10 * 1024 * 1024)
                return new SimpleValidationResult(false, "Car image must be smaller than 10MB.");

            // Check file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
                return new SimpleValidationResult(false, "Car image must be a valid image file (JPEG, PNG, GIF, WebP).");

            return new SimpleValidationResult(true, null);
        }

        // IMAGE HANDLING METHODS
        private async Task<string> SaveCarImage(IFormFile file, int userId, int imageIndex)
        {
            // Create directory
            var uploadsDir = Path.Combine(_environment.WebRootPath, "uploads", "cars");
            if (!Directory.Exists(uploadsDir))
            {
                Directory.CreateDirectory(uploadsDir);
            }

            // Generate filename
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            var fileName = $"car_{userId}_{DateTime.Now:yyyyMMddHHmmss}_{imageIndex}_{Guid.NewGuid().ToString("N")[..8]}{fileExtension}";
            var filePath = Path.Combine(uploadsDir, fileName);

            // Save file
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(stream);
            }

            return $"/uploads/cars/{fileName}";
        }

        private void DeleteFile(string filePath)
        {
            try
            {
                if (string.IsNullOrEmpty(filePath)) return;
                
                var fullPath = Path.Combine(_environment.WebRootPath, filePath.TrimStart('/'));
                if (System.IO.File.Exists(fullPath))
                {
                    System.IO.File.Delete(fullPath);
                    Console.WriteLine($"Deleted file: {fullPath}");
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Failed to delete file {filePath}: {ex.Message}");
            }
        }
    }

    // DATA TRANSFER OBJECTS (DTOs)
    public class CarListingCreateDto
    {
        public string Title { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public decimal Price { get; set; }
        public int Year { get; set; }
        public int Mileage { get; set; }
        public string Description { get; set; }
        public int UserId { get; set; }
        public List<IFormFile>? Images { get; set; } = new List<IFormFile>();
    }

    public class CarListingUpdateDto
    {
        public string Title { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public decimal Price { get; set; }
        public int Year { get; set; }
        public int Mileage { get; set; }
        public string Description { get; set; }
        public int UserId { get; set; }
        public List<IFormFile>? Images { get; set; } = new List<IFormFile>();
        
        // NEW: Support for keeping existing images
        public string? KeepExistingImages { get; set; } // JSON string of image paths to keep
    }

    // SIMPLE VALIDATION CLASS
    public class SimpleValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; }

        public SimpleValidationResult(bool isValid, string errorMessage)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }
    }
}