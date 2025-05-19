using System.ComponentModel.DataAnnotations;

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
    }
}
