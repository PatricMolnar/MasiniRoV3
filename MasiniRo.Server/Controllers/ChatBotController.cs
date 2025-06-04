using Microsoft.AspNetCore.Mvc;
using MasiniRo.Server.Services;

namespace MasiniRo.Server.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatBotController : ControllerBase
    {
        private readonly ChatBotService _chatBotService;

        public ChatBotController(ChatBotService chatBotService)
        {
            _chatBotService = chatBotService;
        }

        [HttpPost("recommend")]
        public async Task<ActionResult<string>> GetRecommendation([FromBody] List<string> userAnswers)
        {
            try
            {
                if (userAnswers == null || userAnswers.Count == 0)
                {
                    return BadRequest("User answers are required");
                }

                var recommendation = await _chatBotService.GetCarRecommendation(userAnswers);
                return Ok(recommendation);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred: {ex.Message}");
            }
        }
    }
} 