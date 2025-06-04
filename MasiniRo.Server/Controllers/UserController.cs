using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MasiniRo.Server.Data;
using MasiniRo.Server.Models;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UserController : ControllerBase
    {
        private readonly AppDbContext _context;

        public UserController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/User/profile/{username}
        [HttpGet("profile/{username}")]
        public async Task<ActionResult<AppUser>> GetUserProfile(string username)
        {
            var user = await _context.AppUsers
                .FirstOrDefaultAsync(u => u.Username == username);

            if (user == null)
            {
                return NotFound();
            }

            // Don't return the password for security
            user.Password = null;

            return user;
        }

        // GET: api/User/profile/current (for when we implement proper auth)
        [HttpGet("profile/current")]
        public async Task<ActionResult<AppUser>> GetCurrentUserProfile()
        {
            // For now, let's get the first user (we'll improve this later)
            var user = await _context.AppUsers.FirstOrDefaultAsync();

            if (user == null)
            {
                return NotFound();
            }

            // Don't return the password for security
            user.Password = null;

            return user;
        }
    }
}