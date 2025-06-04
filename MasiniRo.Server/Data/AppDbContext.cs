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
        public DbSet<Favorite> Favorites { get; set; } = null!; // NEW: Add Favorites

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            // Configure Favorite relationships to prevent cascading deletes
            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.User)
                .WithMany()
                .HasForeignKey(f => f.UserId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<Favorite>()
                .HasOne(f => f.CarListing)
                .WithMany()
                .HasForeignKey(f => f.CarListingId)
                .OnDelete(DeleteBehavior.Restrict);

            // Ensure unique constraint - user can't favorite the same car twice
            modelBuilder.Entity<Favorite>()
                .HasIndex(f => new { f.UserId, f.CarListingId })
                .IsUnique();

            base.OnModelCreating(modelBuilder);
        }
    }
}