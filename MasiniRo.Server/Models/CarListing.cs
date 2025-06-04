using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MasiniRo.Server.Models
{
    public class CarListing
    {
        [Key]
        public int Id { get; set; }
        public string Title { get; set; }
        public string Brand { get; set; }
        public string Model { get; set; }
        public decimal Price { get; set; }
        public int Year { get; set; }
        public string Description { get; set; }
        public string ImageUrl { get; set; }
        
        // User relationship
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual AppUser User { get; set; }
        
        // CreatedAt should already exist - don't add it again if it's already there
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
}