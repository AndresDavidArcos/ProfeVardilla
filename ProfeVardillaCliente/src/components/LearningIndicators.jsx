import { useState } from 'react';
import { FaCheck, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { indicators } from '../constants/indicators';
export default function LearningIndicators({ onStartEvaluation, questionsPerIndicator, setQuestionsPerIndicator }) {
  const [selectedIndicators, setSelectedIndicators] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({ 1: true, 2: true });

  const toggleIndicator = (id) => {
    setSelectedIndicators(prev => 
      prev.includes(id)
        ? prev.filter(i => i !== id)
        : [...prev, id]
    );
  };

  const toggleCategory = (categoryId) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId]
    }));
  };

  const handleNumberChange = (value) => {
    const newValue = Math.min(Math.max(value, 1), 10);
    setQuestionsPerIndicator(newValue);
  };



  return (
    <div className="space-y-8">
      {/* Slider*/}
      <div className="bg-white p-6 rounded-lg shadow-sm space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Preguntas por indicador
        </label>
        <span className="text-lg font-semibold text-primary-500">{questionsPerIndicator}</span>
      </div>
      <input
        type="range"
        min="1"
        max="10"
        value={questionsPerIndicator}
        onChange={(e) => handleNumberChange(Number(e.target.value))}
        className="w-full h-1 bg-gray-200 rounded-full appearance-none cursor-pointer accent-primary-500"
      />
      <div className="flex justify-between text-xs text-gray-400">
        <span>Min</span>
        <span>Max</span>
      </div>
    </div>

      {/* Learning indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(indicators).map(([categoryId, category]) => (
          <div key={categoryId} className="space-y-4">
            <div 
              className="flex items-center justify-between bg-gray-50 p-4 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors"
              onClick={() => toggleCategory(parseInt(categoryId))}
            >
              <h3 className="font-semibold text-gray-800">{category.title}</h3>
              {expandedCategories[categoryId] ? <FaChevronUp /> : <FaChevronDown />}
            </div>
            
            {expandedCategories[categoryId] && (
              <div className="grid gap-4">
                {Object.entries(category.items).map(([id, text]) => (
                  <div
                    key={id}
                    className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                      selectedIndicators.includes(id)
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-200 hover:border-primary-200'
                    }`}
                    onClick={() => toggleIndicator(id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                        selectedIndicators.includes(id)
                          ? 'border-primary-500 bg-primary-500 text-white'
                          : 'border-gray-300'
                      }`}>
                        {selectedIndicators.includes(id) && <FaCheck className="w-3 h-3" />}
                      </div>
                      <div>
                        <p className="font-medium text-sm text-gray-900 mb-1">{id}</p>
                        <p className="text-sm text-gray-600">{text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Start evaluation button */}
      <button
        onClick={() => onStartEvaluation(selectedIndicators)}
        disabled={selectedIndicators.length === 0}
        className={`w-full py-3 px-4 rounded-lg text-white transition-colors ${
          selectedIndicators.length === 0
            ? 'bg-gray-400 cursor-not-allowed'
            : 'bg-primary-500 hover:bg-primary-600'
        }`}
      >
        Comenzar Evaluación ({selectedIndicators.length} indicadores seleccionados)
      </button>
    </div>
  );
}