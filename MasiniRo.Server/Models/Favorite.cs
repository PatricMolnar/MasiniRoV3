using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace MasiniRo.Server.Models
{
    public class Favorite
    {
        [Key]
        public int Id { get; set; }
        
        // User who saved the listing
        public int UserId { get; set; }
        
        [ForeignKey("UserId")]
        public virtual AppUser User { get; set; }
        
        // Car listing that was saved
        public int CarListingId { get; set; }
        
        [ForeignKey("CarListingId")]
        public virtual CarListing CarListing { get; set; }
        
        // When it was saved - using different name to avoid conflicts
        public DateTime SavedAt { get; set; } = DateTime.Now;
    }
}