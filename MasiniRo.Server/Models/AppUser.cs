using Microsoft.AspNetCore.Identity;

namespace MasiniRo.Server.Models
{
    public class AppUser
    {
        public int Id { get; set; }
        public string Username { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string FirstName { get; set; } = string.Empty;
        public string LastName { get; set; } = string.Empty;
        public string PhoneNumber { get; set; } = string.Empty;
        public string? ProfilePicturePath { get; set; } = null; // Only this field should be new
        
        // Navigation property for user's car listings
        public virtual ICollection<CarListing> CarListings { get; set; } = new List<CarListing>();
    }
}