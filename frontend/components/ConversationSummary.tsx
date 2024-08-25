import React, { useEffect, useState } from 'react';
import axios from 'axios';

// Define the state interface for the summary
interface SummaryResponse {
  summary: string;
}

// Component to display the conversation summary
const ConversationSummary: React.FC = () => {
  const [summary, setSummary] = useState<string>('');

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await axios.get('http://127.0.0.1:5000/conversation-summary');
        setSummary(response.data.summary);
      } catch (error) {
        console.error('Error fetching conversation summary:', error);
      }
    };

    fetchSummary();
  }, []);

  return (
    <div className="bg-gray-100 border border-gray-300 rounded-lg shadow-lg p-6 max-w-2xl mx-auto my-10 font-sans h-[60%] w-[60%]items-center">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">Conversation Summary</h2>
      <p className="text-gray-700">{summary}</p>
    </div>
  );
};

export default ConversationSummary;
