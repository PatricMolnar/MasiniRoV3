using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MasiniRo.Server.Data;
using MasiniRo.Server.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using Microsoft.IdentityModel.Tokens;
using System.Text;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly AppDbContext _context;
        private readonly IConfiguration _configuration;

        public AuthController(AppDbContext context, IConfiguration configuration)
        {
            _context = context;
            _configuration = configuration;
        }

        [HttpPost("login")]
        public async Task<ActionResult> Login([FromBody] AuthLoginRequest request)
        {
            try
            {
                // Input validation
                if (string.IsNullOrWhiteSpace(request.Username) || string.IsNullOrWhiteSpace(request.Password))
                {
                    return BadRequest(new { 
                        success = false, 
                        message = "Please provide both username/email and password." 
                    });
                }

                // Check if user exists by username or email
                var user = await _context.AppUsers
                    .FirstOrDefaultAsync(u => u.Username == request.Username || u.Email == request.Username);

                if (user == null)
                {
                    return Unauthorized(new { 
                        success = false, 
                        message = "❌ User account not found. Please check your username/email or create a new account." 
                    });
                }

                // Check password
                if (user.Password != request.Password)
                {
                    return Unauthorized(new { 
                        success = false, 
                        message = "❌ Incorrect password. Please check your password and try again." 
                    });
                }

                // Generate JWT token
                var token = GenerateJwtToken(user);

                return Ok(new
                {
                    success = true,
                    message = "✅ Login successful! Welcome back!",
                    token = token,
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
                return StatusCode(500, new { 
                    success = false, 
                    message = "An error occurred during login. Please try again later." 
                });
            }
        }

        [HttpGet("verify")]
        public async Task<ActionResult> VerifyToken()
        {
            var token = Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").Last();
            
            if (token == null)
                return Unauthorized(new { 
                    success = false, 
                    message = "No authentication token provided." 
                });

            try
            {
                var tokenHandler = new JwtSecurityTokenHandler();
                var key = Encoding.ASCII.GetBytes("YourSecretKeyHere123456789012345678901234567890");
                
                tokenHandler.ValidateToken(token, new TokenValidationParameters
                {
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ValidateIssuer = false,
                    ValidateAudience = false,
                    ClockSkew = TimeSpan.Zero
                }, out SecurityToken validatedToken);

                var jwtToken = (JwtSecurityToken)validatedToken;
                var userId = int.Parse(jwtToken.Claims.First(x => x.Type == "id").Value);

                var user = await _context.AppUsers.FindAsync(userId);
                
                if (user == null)
                    return Unauthorized(new { 
                        success = false, 
                        message = "User account no longer exists." 
                    });

                return Ok(new
                {
                    success = true,
                    id = user.Id,
                    username = user.Username,
                    email = user.Email,
                    firstName = user.FirstName,
                    lastName = user.LastName,
                    phoneNumber = user.PhoneNumber,
                    profilePicturePath = user.ProfilePicturePath
                });
            }
            catch
            {
                return Unauthorized(new { 
                    success = false, 
                    message = "Invalid or expired authentication token." 
                });
            }
        }

        private string GenerateJwtToken(AppUser user)
        {
            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.ASCII.GetBytes("YourSecretKeyHere123456789012345678901234567890");
            
            var tokenDescriptor = new SecurityTokenDescriptor
            {
                Subject = new ClaimsIdentity(new[]
                {
                    new Claim("id", user.Id.ToString()),
                    new Claim("username", user.Username),
                    new Claim("email", user.Email)
                }),
                Expires = DateTime.UtcNow.AddDays(7),
                SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
            };
            
            var token = tokenHandler.CreateToken(tokenDescriptor);
            return tokenHandler.WriteToken(token);
        }
    }

    public class AuthLoginRequest
    {
        public string Username { get; set; } // Can be username or email
        public string Password { get; set; }
    }
}