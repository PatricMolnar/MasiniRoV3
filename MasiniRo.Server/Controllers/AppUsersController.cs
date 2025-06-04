using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MasiniRo.Server.Data;
using MasiniRo.Server.Models;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Linq;
using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AppUsersController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IWebHostEnvironment _environment;

        public AppUsersController(AppDbContext context, IWebHostEnvironment environment)
        {
            _context = context;
            _environment = environment;
        }

        // GET: api/AppUsers
        [HttpGet]
        public async Task<ActionResult<IEnumerable<AppUser>>> GetAppUsers()
        {
            return await _context.AppUsers.ToListAsync();
        }

        // GET: api/AppUsers/5
        [HttpGet("{id}")]
        public async Task<ActionResult<AppUser>> GetAppUser(int id)
        {
            var appUser = await _context.AppUsers.FindAsync(id);

            if (appUser == null)
            {
                return NotFound();
            }

            return appUser;
        }

        // GET: api/AppUsers/check-username/{username}
        [HttpGet("check-username/{username}")]
        public async Task<ActionResult> CheckUsernameUniqueness(string username)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(username) || username.Length < 3)
                {
                    return BadRequest(new { exists = false, message = "Username too short" });
                }

                var existingUser = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == username.ToLower());

                return Ok(new { exists = existingUser != null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { exists = false, message = "Error checking username" });
            }
        }

        // GET: api/AppUsers/check-email/{email}
        [HttpGet("check-email/{email}")]
        public async Task<ActionResult> CheckEmailUniqueness(string email)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(email))
                {
                    return BadRequest(new { exists = false, message = "Email cannot be empty" });
                }

                var existingUser = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == email.ToLower());

                return Ok(new { exists = existingUser != null });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { exists = false, message = "Error checking email" });
            }
        }

        // POST: api/AppUsers (existing endpoint - keep for compatibility)
        [HttpPost]
        public async Task<ActionResult<AppUser>> PostAppUser(AppUser appUser)
        {
            _context.AppUsers.Add(appUser);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetAppUser), new { id = appUser.Id }, appUser);
        }

        // NEW: POST: api/AppUsers/register (improved registration with validation and file upload)
        [HttpPost("register")]
        public async Task<ActionResult> Register([FromForm] UserRegistrationDto registrationDto)
        {
            try
            {
                // Validate input
                var validationResult = ValidateRegistrationData(registrationDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                // Validate profile picture if provided
                if (registrationDto.ProfilePicture != null)
                {
                    var fileValidation = ValidateProfilePicture(registrationDto.ProfilePicture);
                    if (!fileValidation.IsValid)
                    {
                        return BadRequest(new { message = fileValidation.ErrorMessage });
                    }
                }

                // Check if username already exists
                var existingUserByUsername = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.Username.ToLower() == registrationDto.Username.ToLower());
                
                if (existingUserByUsername != null)
                {
                    return Conflict(new { message = "Username already exists. Please choose a different username." });
                }

                // Check if email already exists
                var existingUserByEmail = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.Email.ToLower() == registrationDto.Email.ToLower());
                
                if (existingUserByEmail != null)
                {
                    return Conflict(new { message = "Email already exists. Please use a different email address." });
                }

                // Handle profile picture upload
                string profilePicturePath = null;
                if (registrationDto.ProfilePicture != null)
                {
                    profilePicturePath = await SaveProfilePicture(registrationDto.ProfilePicture, registrationDto.Username);
                }

                // Create new user
                var newUser = new AppUser
                {
                    Username = registrationDto.Username,
                    Email = registrationDto.Email,
                    Password = registrationDto.Password, // In production, hash this password!
                    FirstName = registrationDto.FirstName,
                    LastName = registrationDto.LastName,
                    PhoneNumber = registrationDto.PhoneNumber,
                    ProfilePicturePath = profilePicturePath
                };

                _context.AppUsers.Add(newUser);
                await _context.SaveChangesAsync();

                return Ok(new { message = "User registered successfully!" });
            }
            catch (Exception ex)
            {
                // Log the exception details for debugging
                Console.WriteLine($"Registration error: {ex.Message}");
                return StatusCode(500, new { message = $"Registration failed: {ex.Message}" });
            }
        }

        // PUT: api/AppUsers/{id}/profile - Update user profile
        [HttpPut("{id}/profile")]
        public async Task<ActionResult> UpdateUserProfile(int id, [FromForm] UserProfileUpdateDto profileDto)
        {
            try
            {
                // Find the user
                var user = await _context.AppUsers.FindAsync(id);
                if (user == null)
                {
                    return NotFound(new { message = "User not found." });
                }

                // Authorization check - ensure user can only edit their own profile
                // Note: In a real app, you'd get the current user ID from JWT token
                // For now, we'll trust the client-side check

                // Validate the profile data
                var validationResult = ValidateProfileUpdateData(profileDto);
                if (!validationResult.IsValid)
                {
                    return BadRequest(new { message = validationResult.ErrorMessage });
                }

                // Check if username is taken by another user
                if (!string.IsNullOrWhiteSpace(profileDto.Username) && profileDto.Username != user.Username)
                {
                    var existingUser = await _context.AppUsers
                        .FirstOrDefaultAsync(u => u.Username.ToLower() == profileDto.Username.ToLower() && u.Id != id);
                    
                    if (existingUser != null)
                    {
                        return Conflict(new { message = "Username is already taken. Please choose a different username." });
                    }
                }

                // Handle profile picture update
                string newProfilePicturePath = user.ProfilePicturePath;
                
                if (profileDto.RemoveProfilePicture)
                {
                    // Remove existing profile picture
                    if (!string.IsNullOrEmpty(user.ProfilePicturePath))
                    {
                        DeleteFile(user.ProfilePicturePath);
                    }
                    newProfilePicturePath = null;
                }
                else if (profileDto.ProfilePicture != null)
                {
                    // Validate new profile picture
                    var pictureValidation = ValidateProfilePicture(profileDto.ProfilePicture);
                    if (!pictureValidation.IsValid)
                    {
                        return BadRequest(new { message = pictureValidation.ErrorMessage });
                    }

                    // Delete old profile picture if exists
                    if (!string.IsNullOrEmpty(user.ProfilePicturePath))
                    {
                        DeleteFile(user.ProfilePicturePath);
                    }

                    // Save new profile picture
                    newProfilePicturePath = await SaveProfilePicture(profileDto.ProfilePicture, profileDto.Username ?? user.Username);
                }

                // Update user data
                user.Username = profileDto.Username ?? user.Username;
                user.FirstName = profileDto.FirstName ?? user.FirstName;
                user.LastName = profileDto.LastName ?? user.LastName;
                user.PhoneNumber = profileDto.PhoneNumber ?? user.PhoneNumber;
                user.ProfilePicturePath = newProfilePicturePath;

                await _context.SaveChangesAsync();

                return Ok(new { 
                    message = "Profile updated successfully!",
                    user = new
                    {
                        id = user.Id,
                        username = user.Username,
                        email = user.Email,
                        firstName = user.FirstName,
                        lastName = user.LastName,
                        phoneNumber = user.PhoneNumber,
                        profilePicturePath = user.ProfilePicturePath
                    }
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Profile update failed: {ex.Message}" });
            }
        }

        // PUT: api/AppUsers/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutAppUser(int id, AppUser appUser)
        {
            if (id != appUser.Id)
            {
                return BadRequest();
            }

            _context.Entry(appUser).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!AppUserExists(id))
                {
                    return NotFound();
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/AppUsers/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteAppUser(int id)
        {
            var appUser = await _context.AppUsers.FindAsync(id);
            if (appUser == null)
            {
                return NotFound();
            }

            _context.AppUsers.Remove(appUser);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        // POST: api/AppUsers/login (keeping your existing login)
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest loginRequest)
        {
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Email == loginRequest.Email && u.Password == loginRequest.Password);

            if (user == null)
            {
                return Unauthorized(new { message = "Invalid email or password." });
            }

            // In a real application, you would generate a JWT token here
            return Ok(new { message = "Login successful", userId = user.Id });
        }

        // GET: api/AppUsers/profile/{username}
        [HttpGet("profile/{username}")]
        public async Task<ActionResult<AppUser>> GetUserProfile(string username)
        {
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return NotFound(new { message = "User not found." });
            }

            // Don't return the password for security
            user.Password = null;

            return user;
        }

        private bool AppUserExists(int id)
        {
            return _context.AppUsers.Any(e => e.Id == id);
        }

        // FILE UPLOAD METHODS
        private ValidationResult ValidateProfilePicture(IFormFile file)
        {
            // Check file size (5MB max)
            if (file.Length > 5 * 1024 * 1024)
            {
                return new ValidationResult(false, "Profile picture must be smaller than 5MB.");
            }

            // Check file type
            var allowedTypes = new[] { "image/jpeg", "image/jpg", "image/png", "image/gif", "image/webp" };
            if (!allowedTypes.Contains(file.ContentType.ToLower()))
            {
                return new ValidationResult(false, "Profile picture must be a valid image file (JPEG, PNG, GIF, WebP).");
            }

            // Check file extension
            var allowedExtensions = new[] { ".jpg", ".jpeg", ".png", ".gif", ".webp" };
            var fileExtension = Path.GetExtension(file.FileName).ToLower();
            if (!allowedExtensions.Contains(fileExtension))
            {
                return new ValidationResult(false, "Invalid file extension. Use .jpg, .png, .gif, or .webp");
            }

            return new ValidationResult(true, null);
        }

        private async Task<string> SaveProfilePicture(IFormFile file, string username)
        {
            try
            {
                // Create uploads directory if it doesn't exist
                var uploadsDir = Path.Combine(_environment.WebRootPath, "uploads", "profiles");
                if (!Directory.Exists(uploadsDir))
                {
                    Directory.CreateDirectory(uploadsDir);
                }

                // Generate unique filename
                var fileExtension = Path.GetExtension(file.FileName).ToLower();
                var fileName = $"{username}_{Guid.NewGuid()}{fileExtension}";
                var filePath = Path.Combine(uploadsDir, fileName);

                // Save file
                using (var stream = new FileStream(filePath, FileMode.Create))
                {
                    await file.CopyToAsync(stream);
                }

                // Return relative path for database storage
                return $"/uploads/profiles/{fileName}";
            }
            catch (Exception ex)
            {
                throw new Exception($"Failed to save profile picture: {ex.Message}");
            }
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
                }
            }
            catch (Exception ex)
            {
                // Log error but don't throw - file deletion failure shouldn't break the operation
                Console.WriteLine($"Failed to delete file {filePath}: {ex.Message}");
            }
        }

        // VALIDATION METHODS
        private ValidationResult ValidateRegistrationData(UserRegistrationDto dto)
        {
            // Username validation
            if (string.IsNullOrWhiteSpace(dto.Username) || dto.Username.Length < 3)
            {
                return new ValidationResult(false, "Username must be at least 3 characters long.");
            }

            if (dto.Username.Length > 30)
            {
                return new ValidationResult(false, "Username cannot exceed 30 characters.");
            }

            // Email validation
            if (string.IsNullOrWhiteSpace(dto.Email) || !IsValidEmail(dto.Email))
            {
                return new ValidationResult(false, "Please provide a valid email address.");
            }

            if (dto.Email.Length > 100)
            {
                return new ValidationResult(false, "Email cannot exceed 100 characters.");
            }

            // Password validation
            if (string.IsNullOrWhiteSpace(dto.Password) || dto.Password.Length < 6)
            {
                return new ValidationResult(false, "Password must be at least 6 characters long.");
            }

            if (dto.Password.Length > 50)
            {
                return new ValidationResult(false, "Password cannot exceed 50 characters.");
            }

            if (dto.Password.Contains(" "))
            {
                return new ValidationResult(false, "Password cannot contain spaces.");
            }

            // Phone number validation
            if (string.IsNullOrWhiteSpace(dto.PhoneNumber) || !IsValidPhoneNumber(dto.PhoneNumber))
            {
                return new ValidationResult(false, "Phone number must be exactly 10 digits.");
            }

            // Name validation
            if (string.IsNullOrWhiteSpace(dto.FirstName))
            {
                return new ValidationResult(false, "First name is required.");
            }

            if (dto.FirstName.Length > 50)
            {
                return new ValidationResult(false, "First name cannot exceed 50 characters.");
            }

            if (string.IsNullOrWhiteSpace(dto.LastName))
            {
                return new ValidationResult(false, "Last name is required.");
            }

            if (dto.LastName.Length > 50)
            {
                return new ValidationResult(false, "Last name cannot exceed 50 characters.");
            }

            return new ValidationResult(true, null);
        }

        private ValidationResult ValidateProfileUpdateData(UserProfileUpdateDto dto)
        {
            // Username validation (if provided)
            if (!string.IsNullOrWhiteSpace(dto.Username))
            {
                if (dto.Username.Length < 3)
                {
                    return new ValidationResult(false, "Username must be at least 3 characters long.");
                }

                if (dto.Username.Length > 30)
                {
                    return new ValidationResult(false, "Username cannot exceed 30 characters.");
                }
            }

            // Phone number validation (if provided)
            if (!string.IsNullOrWhiteSpace(dto.PhoneNumber) && !IsValidPhoneNumber(dto.PhoneNumber))
            {
                return new ValidationResult(false, "Phone number must be exactly 10 digits.");
            }

            // Name validation
            if (!string.IsNullOrWhiteSpace(dto.FirstName))
            {
                if (dto.FirstName.Length > 50)
                {
                    return new ValidationResult(false, "First name cannot exceed 50 characters.");
                }
            }

            if (!string.IsNullOrWhiteSpace(dto.LastName))
            {
                if (dto.LastName.Length > 50)
                {
                    return new ValidationResult(false, "Last name cannot exceed 50 characters.");
                }
            }

            return new ValidationResult(true, null);
        }

        private bool IsValidEmail(string email)
        {
            try
            {
                var emailRegex = @"^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$";
                return Regex.IsMatch(email, emailRegex);
            }
            catch
            {
                return false;
            }
        }

        private bool IsValidPhoneNumber(string phoneNumber)
        {
            // Remove any non-digit characters for validation
            var digitsOnly = Regex.Replace(phoneNumber, @"[^\d]", "");
            return digitsOnly.Length == 10;
        }
    }

    // DTOs and Helper Classes
    public class UserRegistrationDto
    {
        public string Username { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string PhoneNumber { get; set; }
        public IFormFile? ProfilePicture { get; set; } // Optional profile picture
    }

    public class UserProfileUpdateDto
    {
        public string? Username { get; set; }
        public string? FirstName { get; set; }
        public string? LastName { get; set; }
        public string? PhoneNumber { get; set; }
        public IFormFile? ProfilePicture { get; set; }
        public bool RemoveProfilePicture { get; set; } = false;
    }

    public class ValidationResult
    {
        public bool IsValid { get; set; }
        public string ErrorMessage { get; set; }

        public ValidationResult(bool isValid, string errorMessage)
        {
            IsValid = isValid;
            ErrorMessage = errorMessage;
        }
    }

    // Helper class for login request body (keeping your existing one)
    public class LoginRequest
    {
        public string Email { get; set; }
        public string Password { get; set; }
    }
}