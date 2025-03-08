import { FaBookOpen } from 'react-icons/fa';

function ChatMessage({ message, pdfBaseUrl }) {
  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const isAi = message.sender !== 'user';

  const sources = (message.relevant_documents || []).map((document) => {
    const fileName = document.source?.split('\\').pop().replace('.pdf', '') || 'Unknown';
    console.log("filename: ", fileName, "sourceBaseUrl", pdfBaseUrl)
    return {
      title: fileName,
      url: `${pdfBaseUrl}${fileName}.pdf#page=${parseInt(document.page)+1}` || '#',
      page: parseInt(document.page)+1 || 'N/A',
    };
  });
  
  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 message-appear`}>
      <div className={`max-w-[70%] rounded-lg p-4 ${isAi ? 'bg-gray-100' : 'bg-[#CD1F32] text-white'}`}>
        <p className="text-sm">{message.text}</p>
        {isAi && sources.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Fuentes:</p>
            <div className="flex flex-wrap gap-1.5">
              {sources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center bg-gray-50 hover:bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs transition-colors"
                >
                  <FaBookOpen className="w-3 h-3 mr-1.5" />
                  <span>{source.title}</span>
                  <span className="mx-1.5">•</span>
                  <span className="font-medium">p.{source.page}</span>
                </a>
              ))}
            </div>
          </div>
        )}
        <span className="block text-xs text-gray-400 mt-1">{formattedTimestamp}</span>
      </div>
    </div>
  );
}

export default ChatMessage;