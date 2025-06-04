using System.Text;
using System.Text.Json;
using MasiniRo.Server.Models;
using MasiniRo.Server.Data;
using Microsoft.EntityFrameworkCore;

namespace MasiniRo.Server.Services
{
    public class ChatBotService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;
        private readonly AppDbContext _context;

        public ChatBotService(HttpClient httpClient, IConfiguration configuration, AppDbContext context)
        {
            _httpClient = httpClient;
            _apiKey = configuration["GeminiApi:ApiKey"] ?? throw new ArgumentNullException("GeminiApi:ApiKey");
            _context = context;
        }

        public async Task<string> GetCarRecommendation(List<string> userAnswers)
        {
            // Get all car listings
            var cars = await _context.CarListings
                .Include(c => c.User)
                .Select(c => new
                {
                    c.Id,
                    c.Title,
                    c.Brand,
                    c.Model,
                    c.Price,
                    c.Year,
                    c.Description,
                    c.ImageUrl
                })
                .ToListAsync();

            // Create the prompt for Gemini
            var prompt = CreatePrompt(userAnswers, cars);

            // Call Gemini API
            var response = await CallGeminiApi(prompt);

            return response;
        }

        private string CreatePrompt<T>(List<string> userAnswers, List<T> cars)
        {
            var carsJson = JsonSerializer.Serialize(cars);
            
            return $@"You are a car recommendation expert. Based on the following user preferences and available cars, recommend the best matches.

User Preferences:
{string.Join("\n", userAnswers.Select((answer, index) => $"Q{index + 1}: {answer}"))}

Available Cars:
{carsJson}

Please analyze the user's preferences and recommend the top 3 most suitable cars from the list. For each recommendation, provide:
1. The car's title and basic details, **including the car's unique ID from the provided list**.
2. A brief explanation of why it matches the user's preferences
3. Any potential concerns or considerations

Format your response in a clear, conversational way. **Ensure you include the car ID for each recommended car.**";
        }

        public async Task<string> TestGeminiApiKey()
        {
            try
            {
                var testPrompt = "Say hello";
                var request = new
                {
                    contents = new[]
                    {
                        new
                        {
                            parts = new[]
                            {
                                new { text = testPrompt }
                            }
                        }
                    }
                };

                var json = JsonSerializer.Serialize(request);
                var content = new StringContent(json, Encoding.UTF8, "application/json");

                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("x-goog-api-key", _apiKey);

                var response = await _httpClient.PostAsync(
                    "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                    content);

                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                    try
                    {
                         var responseObject = JsonSerializer.Deserialize<GeminiResponse>(responseContent);
                         if (responseObject?.candidates?.Any() == true && responseObject.candidates[0].content?.parts?.Any() == true)
                         {
                             return "Gemini API key is valid and connection successful (using gemini-1.5-flash).";
                         } else {
                             return "Gemini API key is valid, but received unexpected response structure. Response content: " + responseContent;
                         }
                    } catch (Exception ex)
                    {
                         return $"Gemini API key is valid, but failed to parse response: {ex.Message}. Response content: {responseContent}";
                    }

                }
                else
                {
                    return $"Gemini API test call failed with status code: {response.StatusCode}. Response: {responseContent}";
                }
            }
            catch (Exception ex)
            {
                return $"An error occurred during Gemini API test: {ex.Message}";
            }
        }

        public async Task<string> ListGeminiModels()
        {
            try
            {
                _httpClient.DefaultRequestHeaders.Clear();
                _httpClient.DefaultRequestHeaders.Add("x-goog-api-key", _apiKey);

                var response = await _httpClient.GetAsync("https://generativelanguage.googleapis.com/v1beta/models");

                var responseContent = await response.Content.ReadAsStringAsync();

                if (response.IsSuccessStatusCode)
                {
                     // You might want to pretty-print the JSON response here
                    return "Available models: " + responseContent;
                }
                else
                {
                    return $"Failed to list models. Status code: {response.StatusCode}. Response: {responseContent}";
                }
            }
            catch (Exception ex)
            {
                return $"An error occurred while listing models: {ex.Message}";
            }
        }

        private async Task<string> CallGeminiApi(string prompt)
        {
            var request = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = prompt }
                        }
                    }
                }
            };

            var json = JsonSerializer.Serialize(request);
            var content = new StringContent(json, Encoding.UTF8, "application/json");

            _httpClient.DefaultRequestHeaders.Add("x-goog-api-key", _apiKey);

            var response = await _httpClient.PostAsync(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent",
                content);

            if (!response.IsSuccessStatusCode)
            {
                throw new Exception($"Gemini API call failed: {response.StatusCode}. Response: {await response.Content.ReadAsStringAsync()}");
            }

            var responseContent = await response.Content.ReadAsStringAsync();
            var responseObject = JsonSerializer.Deserialize<GeminiResponse>(responseContent);

            return responseObject?.candidates?[0]?.content?.parts?[0]?.text ?? "No recommendation available.";
        }
    }

    // Response models for Gemini API
    public class GeminiResponse
    {
        public List<Candidate> candidates { get; set; }
    }

    public class Candidate
    {
        public Content content { get; set; }
    }

    public class Content
    {
        public List<Part> parts { get; set; }
    }

    public class Part
    {
        public string text { get; set; }
    }
} 