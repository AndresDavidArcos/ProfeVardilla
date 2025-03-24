import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

const mockData = {
  practices: [
    {
      id: 1,
      title: "Fundamentos de POO",
      date: "15 Enero, 2025",
      indicators: [
        {
          id: "IL 1.1",
          name: "Conceptos POO",
          results: [true, false, true],
          description: "Comprende los conceptos de ingeniería de software y ciclo de vida"
        },
        {
          id: "IL 1.3",
          name: "Metodologías Ágiles",
          results: [true, true, false, true],
          description: "Reconoce los conceptos que caracterizan las metodologías ágiles"
        }
      ]
    },
    {
      id: 2,
      title: "Patrones de Diseño",
      date: "10 Enero, 2025",
      indicators: [
        {
          id: "IL 2.1",
          name: "Patrones Creacionales",
          results: [true, true, true],
          description: "Produce un release plan y una estimación de tiempo"
        },
        {
          id: "IL 2.4",
          name: "Componentes",
          results: [true, false, false, true, true],
          description: "Define componentes para ser usados en el proceso de desarrollo"
        }
      ]
    }
  ]
};

export default function EvaluationResults() {
  const calculatePercentage = (results) => {
    const correct = results.filter(r => r).length;
    return {
      percentage: Math.round((correct / results.length) * 100),
      correct,
      total: results.length
    };
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Mis Evaluaciones</h2>
        
        {mockData.practices.map((practice) => (
          <div key={practice.id} className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-800">{practice.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{practice.date}</p>
              </div>
              <button className="text-primary-600 hover:text-primary-700 text-sm font-medium flex items-center gap-2 transition-colors">
                Ver detalles
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {practice.indicators.map((indicator) => {
                const stats = calculatePercentage(indicator.results);
                return (
                  <div key={indicator.id} className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-700">{indicator.id}</span>
                      <div className="flex items-center gap-1">
                        {indicator.results.map((result, idx) => (
                          <span
                            key={idx}
                            className={`w-2 h-2 rounded-full ${
                              result ? 'bg-green-600' : 'bg-red-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-3">{indicator.name}</p>
                    <div className="flex justify-between items-center">
                      <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-bold text-primary-600">
                          {stats.percentage}%
                        </span>
                      </div>
                      <span className="text-sm text-gray-500">
                        {stats.correct}/{stats.total} correctas
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {indicator.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}