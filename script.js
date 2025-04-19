document.addEventListener('DOMContentLoaded', function () {
  const codeEditor = document.getElementById('code-editor');
  const languageSelector = document.getElementById('language-select');
  const reviewButton = document.getElementById('review-button');
  const errorMessage = document.getElementById('error-message');
  const reviewResults = document.getElementById('review-results');
  const reviewSummary = document.getElementById('review-summary');
  const issuesSection = document.getElementById('issues-section');
  const issuesList = document.getElementById('issues-list');
  const bestPracticesList = document.getElementById('best-practices-list');
  const improvementSuggestions = document.getElementById('improvement-suggestions');
  const loadingSpinner = document.getElementById('loading-spinner');

  reviewButton.addEventListener('click', async function () {
    const code = codeEditor.value;
    const language = languageSelector.value;

    if (!code.trim()) {
      showError('Please enter some code to review');
      return;
    }

    clearResults();
    showLoading(true);

    try {
      const response = await fetch("http://localhost:5001/api/review", {  // Ensure this matches the backend
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ code, language })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch from backend. Status: ' + response.status);
      }

      const review = await response.json();

      if (review.error) throw new Error(review.error);

      displayResults(review);
    } catch (error) {
      console.error('Error analyzing code:', error);
      showError('Failed to get code review: ' + error.message);
    } finally {
      showLoading(false);
    }
  });

  function displayResults(review) {
    reviewSummary.textContent = review.summary;
    issuesList.innerHTML = '';

    if (review.issues && review.issues.length > 0) {
      review.issues.forEach(issue => {
        const li = document.createElement('li');
        li.className = `issue-item ${issue.severity}`;

        const issueHeader = document.createElement('div');
        issueHeader.className = 'issue-header';

        const severitySpan = document.createElement('span');
        severitySpan.className = 'issue-severity';
        severitySpan.textContent = issue.severity;

        const titleSpan = document.createElement('span');
        titleSpan.className = 'issue-title';
        titleSpan.textContent = issue.title;

        issueHeader.appendChild(severitySpan);
        issueHeader.appendChild(titleSpan);

        const description = document.createElement('p');
        description.className = 'issue-description';
        description.textContent = issue.description;

        li.appendChild(issueHeader);
        li.appendChild(description);

        if (issue.suggestion) {
          const suggestionDiv = document.createElement('div');
          suggestionDiv.className = 'issue-suggestion';

          const suggestionTitle = document.createElement('h4');
          suggestionTitle.textContent = 'Suggestion:';

          const suggestionText = document.createElement('p');
          suggestionText.textContent = issue.suggestion;

          suggestionDiv.appendChild(suggestionTitle);
          suggestionDiv.appendChild(suggestionText);

          li.appendChild(suggestionDiv);
        }

        issuesList.appendChild(li);
      });
      issuesSection.classList.remove('hidden');
    } else {
      issuesSection.classList.add('hidden');
    }

    bestPracticesList.innerHTML = '';
    (review.bestPractices || []).forEach(practice => {
      const li = document.createElement('li');
      li.textContent = practice;
      bestPracticesList.appendChild(li);
    });

    improvementSuggestions.textContent = review.improvementSuggestions || 'No specific suggestions provided.';
    reviewResults.classList.remove('hidden');
    reviewResults.scrollIntoView({ behavior: 'smooth' });
  }

  function showLoading(isLoading) {
    loadingSpinner.classList.toggle('hidden', !isLoading);
    reviewButton.disabled = isLoading;
  }

  function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
      errorMessage.style.display = 'none';
    }, 5000);
  }

  function clearResults() {
    reviewResults.classList.add('hidden');
    errorMessage.style.display = 'none';
  }
});
