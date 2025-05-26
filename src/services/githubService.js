import axios from "axios";

const GITHUB_API_BASE_URL = "https://api.github.com";

/**
 * Parses a GitHub issue URL to extract owner, repo, and issue number.
 * @param {string} issueUrl - The full URL of the GitHub issue.
 * @returns {object|null} An object with owner, repo, and issueNumber, or null if parsing fails.
 */
function parseGitHubIssueUrl(issueUrl) {
   // Example URL: https://github.com/owner/repo/issues/123
   const regex = /github\.com\/([^\/]+)\/([^\/]+)\/issues\/(\d+)/;
   const match = issueUrl.match(regex);

   if (match && match.length === 4) {
      return {
         owner: match[1],
         repo: match[2],
         issueNumber: match[3],
      };
   }
   return null;
}

/**
 * Fetches details (title and body) of a specific GitHub issue.
 * @param {string} owner - The owner of the repository.
 * @param {string} repo - The name of the repository.
 * @param {string} issueNumber - The number of the issue.
 * @returns {Promise<object>} An object containing the issue title and body.
 * @throws {Error} If the API request fails or the issue is not found.
 */
async function getGitHubIssueDetails(owner, repo, issueNumber) {
   const apiUrl = `${GITHUB_API_BASE_URL}/repos/${owner}/${repo}/issues/${issueNumber}`;
   console.log(`[GitHubService] Fetching issue from: ${apiUrl}`);

   try {
      const response = await axios.get(apiUrl, {
         headers: {
            Accept: "application/vnd.github.v3+json",
            // No 'Authorization' header for unauthenticated requests
            // Add 'User-Agent' to avoid potential 403 errors from GitHub
            "User-Agent": "Discord-AI-Bot",
         },
      });

      if (response.status === 200 && response.data) {
         return {
            title: response.data.title,
            body: response.data.body || "This issue has no description body.", // Handle empty body
            url: response.data.html_url,
         };
      } else {
         throw new Error(`Failed to fetch issue: Status ${response.status}`);
      }
   } catch (error) {
      console.error(
         `[GitHubService] Error fetching GitHub issue ${owner}/${repo}#${issueNumber}:`,
         error.response ? error.response.data : error.message
      );
      if (error.response && error.response.status === 404) {
         throw new Error(
            `GitHub issue ${owner}/${repo}#${issueNumber} not found.`
         );
      } else if (error.response && error.response.status === 403) {
         // This often happens due to rate limiting or missing User-Agent
         throw new Error(
            `Access to GitHub API forbidden (403). This might be due to rate limits. Please try again later.`
         );
      }
      throw new Error(
         `Could not fetch GitHub issue. Details: ${error.message}`
      );
   }
}

export { parseGitHubIssueUrl, getGitHubIssueDetails };
