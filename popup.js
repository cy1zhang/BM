document.addEventListener('DOMContentLoaded', () => {
    const queryInput = document.getElementById('query');
    const askButton = document.getElementById('ask');
    const messagesDiv = document.getElementById('messages');
  
    // Function to add a message to the chat
    function addMessage(role, text) {
      const message = document.createElement('div');
      message.className = role === 'user' ? 'user-message' : 'ai-message';
      message.textContent = text;
      messagesDiv.appendChild(message);
      messagesDiv.scrollTop = messagesDiv.scrollHeight; // Auto-scroll to the bottom
    }
  
    // Handle "Ask" button click
    askButton.addEventListener('click', async () => {
      const query = queryInput.value.trim();
      if (!query) return;
  
      // Add user's query to the chat
      addMessage('user', query);
      queryInput.value = ''; // Clear the input
  
      // Send query to the backend
      try {
        const response = await fetch('http://localhost:3000/api/ask', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query }),
        });
        const data = await response.json();
  
        // Add AI's response to the chat
        addMessage('ai', data.answer);
      } catch (error) {
        addMessage('ai', 'Error: Could not connect to the AI agent.');
      }
    });
  
    // Allow pressing "Enter" to send the query
    queryInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        askButton.click();
      }
    });
  });