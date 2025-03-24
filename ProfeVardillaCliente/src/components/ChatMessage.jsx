import { FaChevronUp, FaChevronDown, FaLightbulb, FaStar, FaBookmark, FaExclamationTriangle } from 'react-icons/fa';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
 
function ChatMessage({ message, pdfBaseUrl}) {
  const [showAllSources, setShowAllSources] = useState(false);

  const formattedTimestamp = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
  
  const isAi = message.sender !== 'user';

  const sources = (message.documents || []).map((document) => {
    const fileName = document.metadata.source?.split('\\').pop().replace('.pdf', '') || 'Unknown';
    return {
      title: fileName,
      url: `${pdfBaseUrl}${fileName}.pdf#page=${parseInt(document.metadata.page)+1}` || '#',
      page: parseInt(document.metadata.page)+1 || 'N/A',
    };
  });
  const displayedSources = showAllSources ? sources : sources.slice(0, 4);

  return (
    <div className={`flex ${isAi ? 'justify-start' : 'justify-end'} mb-4 message-appear relative mt-6`}>
      {message.evaluation && (
        <div className="flex gap-2 absolute left-4 -top-3">
          {message.evaluation.isQuestion ? (
            <div className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 flex items-center gap-1">
              <FaBookmark className="w-3 h-3" />
              <span>
                {`Pregunta ${message.evaluation.questionNumber || ''}${
                  message.evaluation.indicatorId ? ` • ${message.evaluation.indicatorId}` : ''
                }${message.evaluation.indicatorValue ? ` • ${message.evaluation.indicatorValue}` : ''}`}
              </span>
            </div>
          ) : (
            <div
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                message.evaluation.passStatus
                  ? 'bg-green-100 text-green-700 border border-green-200'
                  : 'bg-red-100 text-red-700 border border-red-200'
              }`}
            >
              {message.evaluation.passStatus ? (
                <div className="flex items-center gap-1">
                  <FaStar className="w-3 h-3" />
                  <span>Correcto</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <FaExclamationTriangle  className="w-3 h-3" />
                  <span>Incorrecto</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

    
    <div className={`max-w-[70%] rounded-lg p-4 ${
      isAi
        ? `bg-gray-100 ${
            message.evaluation && !message.evaluation.isQuestion
              ? message.evaluation.passStatus
                ? 'border-2 border-green-200'
                : 'border-2 border-red-200'
              : ''
          }`
        : 'bg-[#CD1F32] text-white'
    }`}>
    <div className="text-sm space-y-2">
      <ReactMarkdown>{message.text}</ReactMarkdown>
      {message.options && (
          <div className="mt-3 space-y-2">
            {message.options.map((option, index) => (
              <button
                key={index}
                onClick={() => message.onOptionSelect(option)}
                className="block w-full text-left px-4 py-2 rounded-lg bg-white hover:bg-gray-50 text-gray-700 text-sm transition-colors"
              >
                {option.text || option}
              </button>
            ))}
          </div>
        )}      
      </div>
        {isAi && sources.length > 0 && (
          <div className="mt-3">
            <p className="text-xs font-medium text-gray-600 mb-2">Fuentes:</p>
            <div className="flex flex-wrap gap-1.5">
              {displayedSources.map((source, index) => (
                <a
                  key={index}
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center backdrop-blur-sm bg-white/70 hover:bg-white/90 shadow-sm text-gray-700 px-3 py-1 rounded-full text-xs transition-all"
                >
                  <span
                   className="flex items-center justify-center w-5 h-5 rounded-full bg-primary-100 text-primary-600 mr-1.5 font-semibold">
                   {index+1} 
                   </span>
                  <span>{source.title}</span>
                  <span className="mx-1.5">•</span>
                  <span className="font-medium">p.{source.page}</span>
                </a>
              ))}
            </div>
            {sources.length > 3 && (
              <button
                onClick={() => setShowAllSources(!showAllSources)}
                className="mt-2 text-xs text-primary-500 hover:text-primary-600 flex items-center gap-1 transition-colors"
              >
                {showAllSources ? (
                  <>
                    Ver menos
                    <FaChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    Ver mas ({sources.length - 3} mas)
                    <FaChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}            
          </div>
        )}
        <span className="block text-xs text-gray-400 mt-1">{formattedTimestamp}</span>
      </div>
    </div>
  );
}

export default ChatMessage;