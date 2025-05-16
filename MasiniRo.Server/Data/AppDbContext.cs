using MasiniRo.Server.Models;
using Microsoft.EntityFrameworkCore;

namespace MasiniRo.Server.Data
{
    public class AppDbContext : DbContext
    {
        public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
        {
        }
        public DbSet<CarListing> CarListings { get; set; } = null!;
        public DbSet<AppUser> AppUsers { get; set; } = null!;
    }
}
